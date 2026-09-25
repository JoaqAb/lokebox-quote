import { Box3, Vector3, type BufferGeometry } from 'three'
import type { FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { describe, expect, it } from 'vitest'
import { lengthToMeters } from '../visuals'
import { STUDIO_VIEW, frameDistance } from '../../../core/preview/studioView'
import { SET, SIGN_TEXT, fitTextOnPanel, layoutLetters, lettersFrameVolume } from './sceneGeometry'
import {
  TEXT_3D,
  TEXT_FACE,
  TYPEFACE_SRC,
  buildGlyphGeometry,
  createTypeface,
  glyphAdvance,
  glyphBounds,
  textBounds,
  textPolygons,
} from './typeface'
// El mismo archivo que sirve public/ en TYPEFACE_SRC. Se escribio con JSON.stringify
// compacto, asi su serializacion es la del archivo. Desde que el subset trae N con
// virgulilla y vocales acentuadas ya no es ASCII puro: el peso se cuenta en bytes UTF-8
// con TextEncoder y no en caracteres.
import typefaceJson from '../../../../public/assets/quote/fonts/archivo-black-subset.typeface.json'
import { signsClientOf } from '../testing'


const data = typefaceJson as FontData
const typeface = createTypeface(data)
const SUBSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑÁÉÍÓÚÜ0123456789 '
// Acentuadas del subset, con la letra que acentua cada una. Solo mayusculas: el campo de
// texto del panel fuerza mayusculas.
const ACCENTED = [
  ['Ñ', 'N'],
  ['Á', 'A'],
  ['É', 'E'],
  ['Í', 'I'],
  ['Ó', 'O'],
  ['Ú', 'U'],
  ['Ü', 'U'],
] as const
// Un caracter que el typeface sigue sin tener, y que no es una letra del espanol.
const MISSING = 'Ç'

const clientOrFail = signsClientOf

// Normal media de los triangulos de un grupo, en z.
function groupNormalZ(geometry: BufferGeometry, materialIndex: number): number {
  const normal = geometry.getAttribute('normal')
  let total = 0
  let count = 0
  for (const group of geometry.groups.filter((item) => item.materialIndex === materialIndex)) {
    for (let index = group.start; index < group.start + group.count; index += 1) {
      total += normal.getZ(index)
      count += 1
    }
  }
  return total / count
}

describe('typeface de Archivo Black', () => {
  it('pesa menos de 60 kB y trae exactamente A a Z, 0 a 9, espacio y las acentuadas', () => {
    expect(TYPEFACE_SRC).toBe('/assets/quote/fonts/archivo-black-subset.typeface.json')
    expect(new TextEncoder().encode(JSON.stringify(data)).length).toBeLessThan(60 * 1024)
    expect(Object.keys(data.glyphs).sort()).toEqual([...SUBSET].sort())
    expect(data.original_font_information.copyright).toMatch(/Archivo Black/)
  })

  it('la N con virgulilla y las vocales acentuadas dibujan letra', () => {
    const cap = glyphBounds(typeface, 'H')
    if (cap === null) {
      throw new Error('la H no dio contorno')
    }
    for (const [char, base] of ACCENTED) {
      const geometry = buildGlyphGeometry(typeface, char)
      if (geometry === null) {
        throw new Error(`"${char}" no dio geometria`)
      }
      const bounds = glyphBounds(typeface, char)
      if (bounds === null) {
        throw new Error(`"${char}" no dio contorno`)
      }
      // La tilde y la virgulilla quedan por encima del alto de mayuscula, y cada letra
      // avanza como la que acentua: asi PEÑA y CAFÉ se leen enteras y no pierden el hueco.
      expect(bounds.maxY).toBeGreaterThan(cap.maxY)
      expect(glyphAdvance(typeface, char)).toBeCloseTo(glyphAdvance(typeface, base), 10)
      geometry.dispose()
    }
  })

  it('el alto de mayuscula sale de la H y el avance de cada glifo', () => {
    expect(typeface.capUnits).toBeGreaterThan(0)
    expect(glyphAdvance(typeface, 'H')).toBeCloseTo(data.glyphs.H.ha / typeface.capUnits, 10)
    // El espaciado no es un ancho fijo: la W avanza mas que la I.
    expect(glyphAdvance(typeface, 'W')).toBeGreaterThan(glyphAdvance(typeface, 'I'))
  })

  it('un caracter que no esta no dibuja y ocupa el avance del espacio', () => {
    expect(buildGlyphGeometry(typeface, MISSING)).toBeNull()
    expect(buildGlyphGeometry(typeface, ' ')).toBeNull()
    expect(glyphAdvance(typeface, MISSING)).toBe(glyphAdvance(typeface, ' '))
  })
})

describe('geometria de cada letra', () => {
  it('alto de mayuscula 1 y profundidad 1 con el bisel, centrada', () => {
    const geometry = buildGlyphGeometry(typeface, 'H')
    if (geometry === null) {
      throw new Error('la H no dio geometria')
    }
    const box = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as never)
    const size = box.getSize(new Vector3())
    expect(size.y).toBeCloseTo(1 + 2 * TEXT_3D.bevelSize, 3)
    expect(size.z).toBeCloseTo(1, 6)
    expect(box.min.z).toBeCloseTo(-0.5, 6)
    expect((box.min.y + box.max.y) / 2).toBeCloseTo(0, 3)
    geometry.dispose()
  })

  it('tres materiales: la cara frontal mira adelante, la trasera atras, y los cantos existen', () => {
    for (const char of ['A', 'O', '8', 'W']) {
      const geometry = buildGlyphGeometry(typeface, char)
      if (geometry === null) {
        throw new Error(`"${char}" no dio geometria`)
      }
      expect(new Set(geometry.groups.map((group) => group.materialIndex))).toEqual(new Set([0, 1, 2]))
      expect(groupNormalZ(geometry, TEXT_FACE.front)).toBeCloseTo(1, 6)
      expect(groupNormalZ(geometry, TEXT_FACE.back)).toBeCloseTo(-1, 6)
      const sides = geometry.groups.filter((group) => group.materialIndex === TEXT_FACE.sides)
      expect(sides.reduce((acc, group) => acc + group.count, 0)).toBeGreaterThan(0)
      geometry.dispose()
    }
  })

  // Version 2.4: el relieve lleva el mismo bisel en proporcion al alto y mas profundo.
  it('el relieve tiene el mismo contorno que la letra y un bisel mas profundo', () => {
    const letter = buildGlyphGeometry(typeface, 'R', 'letter')
    const relief = buildGlyphGeometry(typeface, 'R', 'relief')
    if (letter === null || relief === null) {
      throw new Error('la R no dio geometria')
    }
    const letterBox = new Box3().setFromBufferAttribute(letter.getAttribute('position') as never)
    const reliefBox = new Box3().setFromBufferAttribute(relief.getAttribute('position') as never)
    expect(reliefBox.min.x).toBeCloseTo(letterBox.min.x, 6)
    expect(reliefBox.max.y).toBeCloseTo(letterBox.max.y, 6)
    expect(reliefBox.getSize(new Vector3()).z).toBeCloseTo(1, 6)
    expect(TEXT_3D.reliefBevelThickness).toBeGreaterThan(TEXT_3D.bevelThickness)
    expect(TEXT_3D.reliefBevelThickness).toBeLessThan(0.5)
    expect(groupNormalZ(relief, TEXT_FACE.front)).toBeCloseTo(1, 6)
    letter.dispose()
    relief.dispose()
  })

  // Version 2.7, D86: los contornos del halo de letras coinciden con la letra, sin el bisel.
  it('textPolygons ubica los contornos de cada letra como su geometria, con los huecos', () => {
    const layout = layoutLetters('HO', 1, (char) => glyphAdvance(typeface, char))
    const polygons = textPolygons(typeface, layout.boxes)
    // H: un contorno; O: contorno y hueco.
    expect(polygons).toHaveLength(3)
    const xs = polygons.flat().map(([x]) => x)
    const ys = polygons.flat().map(([, y]) => y)
    const bounds = textBounds(typeface, 'HO')
    if (bounds === null) {
      throw new Error('HO tiene que tener contorno')
    }
    // La geometria suma el bisel por fuera del contorno.
    expect(Math.min(...xs)).toBeCloseTo(bounds.minX + TEXT_3D.bevelSize, 1)
    // La O sobresale apenas de la mayuscula, arriba y abajo.
    expect(Math.max(...ys)).toBeGreaterThanOrEqual(0.5 - 1e-6)
    expect(Math.max(...ys)).toBeLessThan(0.53)
    expect(Math.min(...ys)).toBeGreaterThan(-0.53)
    expect(textPolygons(typeface, layoutLetters('   ', 1, (char) => glyphAdvance(typeface, char)).boxes)).toEqual([])
  })

  it('la curva usa curveSegments 4 y el bisel es chico', () => {
    expect(TEXT_3D.curveSegments).toBe(4)
    expect(TEXT_3D.bevelSize).toBeLessThan(0.05)
    expect(TEXT_3D.bevelThickness).toBeLessThan(0.15)
    const bounds = glyphBounds(typeface, 'I')
    expect(bounds).not.toBeNull()
  })
})

describe('texto en relieve del modo area', () => {
  it('en ninguna medida del rango el relieve sale de la cara del panel', () => {
    const texts = ['WWWWWWWWWWWWWWWWWW', 'MMMMMMMMM MMMMMMMM', 'I', 'NORTHLINE', 'NORTE', 'Q8JW 0', 'PEÑA Y CAFÉ', 'ÑÁÉÍÓÚÜ']
    for (const slug of ['northline', 'norte']) {
      const client = clientOrFail(slug)
      const factor = lengthToMeters(client.units.length)
      const { width, height } = client.options
      for (const w of [width.min, width.max]) {
        for (const h of [height.min, height.max]) {
          const box = { width: w * factor, height: h * factor }
          for (const text of texts) {
            const bounds = textBounds(typeface, text)
            if (bounds === null) {
              throw new Error(`"${text}" no dio contorno`)
            }
            const fit = fitTextOnPanel(bounds, box)
            const left = fit.x + bounds.minX * fit.scale
            const right = fit.x + bounds.maxX * fit.scale
            const bottom = fit.y + bounds.minY * fit.scale
            const top = fit.y + bounds.maxY * fit.scale
            const margin = box.width * SIGN_TEXT.marginRatio
            expect(left).toBeGreaterThanOrEqual(-box.width / 2 + margin - 1e-9)
            expect(right).toBeLessThanOrEqual(box.width / 2 - margin + 1e-9)
            expect(top - bottom).toBeLessThanOrEqual(box.height * SIGN_TEXT.maxHeightRatio + 1e-9)
            expect(bottom).toBeGreaterThanOrEqual(-box.height / 2)
            expect(top).toBeLessThanOrEqual(box.height / 2)
            expect((left + right) / 2).toBeCloseTo(0, 9)
          }
        }
      }
    }
  })

  it('el relieve mide 3 mm y apoya sobre la cara', () => {
    expect(SIGN_TEXT.reliefDepth).toBe(0.003)
    expect(SET.sign.thickness).toBeGreaterThan(SIGN_TEXT.reliefDepth)
  })
})

describe('letras corporeas en el encuadre', () => {
  it('18 letras con el alto maximo quedan dentro de la caja del encuadre, y la caja dentro del cuadro en todo el giro', () => {
    const aspect = 16 / 9
    const inside = 1 / (1 + 2 * STUDIO_VIEW.marginRatio)
    const tan = Math.tan((STUDIO_VIEW.fovDeg * Math.PI) / 360)
    for (const slug of ['northline', 'norte']) {
      const client = clientOrFail(slug)
      const letterHeight = client.options.letterHeight.max * lengthToMeters(client.units.length)
      const depth = Math.max(...client.options.depths.map((item) => item.visual.depthMeters))
      const text = 'WMWMWMWMWMWMWMWMWQ'
      const layout = layoutLetters(text, 1, (char) => glyphAdvance(typeface, char))
      const volume = lettersFrameVolume(textBounds(typeface, text), letterHeight, depth)
      // Cada letra, con su contorno real, entra en la caja.
      for (const box of layout.boxes) {
        const glyph = glyphBounds(typeface, box.char)
        if (glyph === null) {
          throw new Error(`"${box.char}" no dio contorno`)
        }
        expect(Math.abs((box.x + glyph.minX) * letterHeight)).toBeLessThanOrEqual(volume.width / 2 + 1e-9)
        expect(Math.abs((box.x + glyph.maxX) * letterHeight)).toBeLessThanOrEqual(volume.width / 2 + 1e-9)
        expect(Math.abs(glyph.minY * letterHeight)).toBeLessThanOrEqual(volume.height / 2 + 1e-9)
        expect(Math.abs(glyph.maxY * letterHeight)).toBeLessThanOrEqual(volume.height / 2 + 1e-9)
      }
      // Y la caja entra en el cuadro desde cualquier azimut, en los dos polares extremos.
      for (const polar of [STUDIO_VIEW.minPolar, STUDIO_VIEW.maxPolar]) {
        for (let azimuth = 0; azimuth < 360; azimuth += 5) {
          const a = (azimuth * Math.PI) / 180
          const z: [number, number, number] = [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)]
          const distance = frameDistance(volume, z, aspect)
          const flat = Math.hypot(z[0], z[2])
          const x = [z[2] / flat, 0, -z[0] / flat]
          const y = [z[1] * x[2], z[2] * x[0] - z[0] * x[2], -z[1] * x[0]]
          for (const sx of [-1, 1]) {
            for (const sy of [-1, 1]) {
              for (const sz of [-1, 1]) {
                const p = [(sx * volume.width) / 2, (sy * volume.height) / 2, (sz * volume.depth) / 2]
                const dot = (u: number[]) => u[0] * p[0] + u[1] * p[1] + u[2] * p[2]
                const along = distance - dot(z)
                expect(Math.abs(dot(x)) / (along * tan * aspect)).toBeLessThanOrEqual(inside + 1e-9)
                expect(Math.abs(dot(y)) / (along * tan)).toBeLessThanOrEqual(inside + 1e-9)
              }
            }
          }
        }
      }
    }
  })
})
