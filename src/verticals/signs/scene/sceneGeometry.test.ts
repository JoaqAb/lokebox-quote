import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../../clients'
import { defaultSelection } from '../../../core/clientConfig'
import { themeFromClient } from '../../../core/theme'
import { lengthToMeters } from '../visuals'
import {
  HALO,
  LIGHTING,
  SET,
  SIGN_TEXT,
  SUPPORT_SHADOW,
  LETTERS,
  SIGN_MODE_BACK_FACE,
  SIGN_STUDIO_LIGHT,
  SIGN_VIEW,
  haloBox,
  haloCellUv,
  haloCells,
  lensShift,
  orbitPosition,
  photoCameraDistance,
  signFrameDistance,
  signModeLightingParams,
  signZoomFactor,
  layoutLetters,
  lampPosition,
  lightingParams,
  scenePalette,
  signBoxMeters,
  signPlacement,
  supportShadowBox,
} from './sceneGeometry'
import { hasWebGL } from './webgl'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

function factorOf(slug: string): number {
  return lengthToMeters(clientOrFail(slug).units.length)
}

function luminance(hex: string): number {
  const color = new Color(hex)
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

describe('signBoxMeters', () => {
  // 12.6
  it('convierte a metros segun la unidad del cliente', () => {
    const northline = clientOrFail('northline')
    const en = signBoxMeters(
      { ...defaultSelection(northline), width: 8, height: 3 },
      lengthToMeters('ft'),
    )
    expect(en.width).toBeCloseTo(2.4384, 6)
    expect(en.height).toBeCloseTo(0.9144, 6)

    const norte = clientOrFail('norte')
    const es = signBoxMeters(
      { ...defaultSelection(norte), width: 2.5, height: 1 },
      lengthToMeters('m'),
    )
    expect(es.width).toBe(2.5)
    expect(es.height).toBe(1)
  })

  // 10.1
  it('el cartel se dibuja centrado en el origen, sin importar el tipo', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const type of ['facade', 'totem']) {
        const placement = signPlacement({ ...defaultSelection(config), type }, factorOf(slug))
        expect(Object.keys(placement)).toEqual(['box'])
        expect(placement.box.width).toBeGreaterThan(0)
        expect(placement.box.height).toBeGreaterThan(0)
      }
    }
  })

  // 10.1
  it('el tipo no cambia la caja: totem perdio su geometria pero sigue siendo cotizable', () => {
    const config = clientOrFail('northline')
    const base = defaultSelection(config)
    const facade = signPlacement({ ...base, type: 'facade' }, factorOf('northline'))
    const totem = signPlacement({ ...base, type: 'totem' }, factorOf('northline'))
    expect(totem.box).toEqual(facade.box)
  })
})

describe('haloBox y supportShadowBox', () => {
  // 10.2
  it('el halo es mas grande que el cartel y queda detras de su cara', () => {
    const config = clientOrFail('norte')
    const placement = signPlacement(defaultSelection(config), factorOf('norte'))
    const halo = haloBox(placement)
    expect(halo.size[0]).toBeCloseTo(placement.box.width + 2 * HALO.marginRatio * placement.box.height, 10)
    expect(halo.size[1]).toBeCloseTo(placement.box.height * (1 + 2 * HALO.marginRatio), 10)
    expect(halo.z).toBeLessThan(-SET.sign.thickness / 2)
  })

  // 10.2
  it('la sombra es mas ancha que alta y queda por debajo del cartel', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    const shadow = supportShadowBox(placement)
    expect(shadow.size[0]).toBeGreaterThan(placement.box.width)
    expect(shadow.size[1]).toBeLessThan(placement.box.height)
    expect(shadow.position[1]).toBeLessThan(0)
    expect(shadow.position[2]).toBeLessThan(0)
    expect(SUPPORT_SHADOW.opacity).toBeLessThan(0.5)
  })
})

describe('lightingParams y lampPosition', () => {
  // 12.4
  it('los tres modos existen y none no enciende nada', () => {
    expect(lightingParams('none')).toEqual(LIGHTING.none)
    expect(LIGHTING.none.faceEmissiveIntensity).toBe(0)
    expect(LIGHTING.none.edgeEmissiveIntensity).toBe(0)
    expect(LIGHTING.none.haloOpacity).toBe(0)
    expect(LIGHTING.none.lampIntensity).toBe(0)
  })

  // 12.4
  it('la emision de los cantos y el halo crecen de none a back', () => {
    expect(LIGHTING.none.edgeEmissiveIntensity).toBeLessThan(LIGHTING.front.edgeEmissiveIntensity)
    expect(LIGHTING.front.edgeEmissiveIntensity).toBeLessThan(LIGHTING.back.edgeEmissiveIntensity)
    expect(LIGHTING.front.haloOpacity).toBeLessThan(LIGHTING.back.haloOpacity)
  })

  it('en back la cara emite menos que en front, para que el texto se lea', () => {
    expect(LIGHTING.back.faceEmissiveIntensity).toBeLessThan(LIGHTING.front.faceEmissiveIntensity)
    expect(LIGHTING.back.haloOpacity).toBeLessThanOrEqual(HALO.maxOpacity)
  })

  // 10.3
  it('cada modo lleva su caida: front es un foco y back un lavado', () => {
    expect(LIGHTING.back.lampDecay).toBeLessThan(LIGHTING.front.lampDecay)
    expect(LIGHTING.back.lampDistance).toBeGreaterThan(LIGHTING.front.lampDistance)
  })

  // 12.5
  it('lampPosition da null en none, adelante en front y detras en back', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(lampPosition('none', placement)).toBeNull()
    const front = lampPosition('front', placement)
    const back = lampPosition('back', placement)
    if (front === null || back === null) {
      throw new Error('front y back tienen que tener lampara')
    }
    expect(front[2]).toBeGreaterThan(0)
    expect(back[2]).toBeLessThan(0)
    expect(front[1]).toBeGreaterThan(placement.box.height / 2)
  })

  // 12.5
  it('en modo cartel no hay halo y back apaga la cara, con los cantos encendidos', () => {
    for (const mode of ['none', 'front', 'back']) {
      expect(signModeLightingParams(mode).haloOpacity).toBe(0)
    }
    expect(signModeLightingParams('none')).toEqual({ ...LIGHTING.none, haloOpacity: 0 })
    expect(signModeLightingParams('front')).toEqual({ ...LIGHTING.front, haloOpacity: 0 })
    const back = signModeLightingParams('back')
    expect(back.faceEmissiveIntensity).toBe(0)
    expect(back.faceShade).toBe(SIGN_MODE_BACK_FACE.faceShade)
    expect(back.faceShade).toBeGreaterThan(0)
    expect(back.faceShade).toBeLessThan(0.25)
    expect(back.edgeEmissiveIntensity).toBe(LIGHTING.back.edgeEmissiveIntensity)
    // En modo vista la cara no se oscurece en ningun modo.
    expect([LIGHTING.none.faceShade, LIGHTING.front.faceShade, LIGHTING.back.faceShade]).toEqual([0, 0, 0])
    expect(() => signModeLightingParams('neon')).toThrow(/neon/)
  })

  it('lanza con un modo desconocido, con el modo en el mensaje', () => {
    const config = clientOrFail('northline')
    const placement = signPlacement(defaultSelection(config), factorOf('northline'))
    expect(() => lightingParams('neon')).toThrow(/neon/)
    expect(() => lampPosition('neon', placement)).toThrow(/neon/)
  })
})

describe('scenePalette', () => {
  // 10.4
  it('queda solo lo que el cartel necesita, derivado del tema y sin negros', () => {
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(Object.keys(palette).sort()).toEqual(['shadow', 'signText'])
      for (const [nombre, color] of Object.entries(palette)) {
        expect(luminance(color), `${slug}.${nombre}`).toBeGreaterThan(0.02)
      }
    }
  })

  // 10.4
  it('el glifo es mas oscuro que la sombra: tiene que leerse sobre una cara clara', () => {
    for (const slug of listClientSlugs()) {
      const palette = scenePalette(themeFromClient(clientOrFail(slug)))
      expect(luminance(palette.signText), slug).toBeLessThan(luminance(palette.shadow))
    }
  })

  it('lanza si falta una variable del tema', () => {
    expect(() => scenePalette({ '--q-primary': '#101317' })).toThrow(/--q-text/)
  })
})

describe('SIGN_TEXT', () => {
  // 10.5
  it('el texto deja margen a los cuatro lados de la cara', () => {
    expect(SIGN_TEXT.marginRatio).toBeGreaterThan(0)
    expect(SIGN_TEXT.marginRatio).toBeLessThan(0.5)
    expect(SIGN_TEXT.maxHeightRatio).toBeLessThan(1)
  })
})

describe('hasWebGL', () => {
  // 12.10
  it('devuelve false en entorno node y no lanza', () => {
    expect(hasWebGL()).toBe(false)
  })
})

describe('layoutLetters', () => {
  // Medida fija para el test: cada caracter avanza 0,5 de alto de letra y el espacio 0,25.
  const measure = (char: string): number => (char === ' ' ? 0.25 : 0.5)

  it('una caja por letra, sin caja para el espacio, centrada en 0', () => {
    const { boxes, totalWidth } = layoutLetters('AB C', 2, measure)
    // Avances en metros: 1 + 1 + 0,5 + 1 = 3,5.
    expect(totalWidth).toBeCloseTo(3.5, 10)
    expect(boxes.map((box) => box.char)).toEqual(['A', 'B', 'C'])
    expect(boxes.map((box) => box.x)).toEqual([-1.25, -0.25, 1.25])
    expect(boxes[0].width).toBeCloseTo(1 * LETTERS.fill, 10)
  })

  it('el ancho escala con el alto de letra', () => {
    const chico = layoutLetters('NORTE', 0.3, measure)
    const grande = layoutLetters('NORTE', 0.9, measure)
    expect(grande.totalWidth / chico.totalWidth).toBeCloseTo(3, 10)
    expect(grande.boxes).toHaveLength(5)
  })

  it('texto sin letras no dibuja cajas', () => {
    expect(layoutLetters('   ', 1, measure).boxes).toHaveLength(0)
  })
})

describe('halo de nueve celdas', () => {
  const placement = { box: { width: 2.4, height: 0.9 } }

  it('ninguna celda pasa el margen de 0,12 del alto del cartel', () => {
    const margin = placement.box.height * HALO.marginRatio
    for (const cell of haloCells(placement)) {
      const right = Math.abs(cell.position[0]) + cell.size[0] / 2
      const top = Math.abs(cell.position[1]) + cell.size[1] / 2
      expect(right, cell.kind).toBeLessThanOrEqual(placement.box.width / 2 + margin + 1e-9)
      expect(top, cell.kind).toBeLessThanOrEqual(placement.box.height / 2 + margin + 1e-9)
    }
    expect(HALO.maxOpacity).toBe(0.55)
  })

  it('el borde exterior de cada celda cae en el borde del degradado, sin corte duro', () => {
    // Coordenadas en el orden de PlaneGeometry: arriba izq, arriba der, abajo izq, abajo der.
    expect(haloCellUv('center')).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    expect(haloCellUv('left')).toEqual([0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5])
    expect(haloCellUv('topRight')).toEqual([0.5, 1, 1, 1, 0.5, 0.5, 1, 0.5])
    expect(haloCellUv('bottom')).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0, 0.5, 0])
  })
})

describe('camara del viewer', () => {
  it('de frente y sin espesor, la distancia encuadra el cartel con 12 por ciento de margen por lado', () => {
    const aspect = 16 / 9
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    // Cartel ancho: manda el ancho.
    const ancho = signFrameDistance({ width: 6, height: 1, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * ancho * tan * aspect).toBeCloseTo(6 * 1.24, 10)
    // Cartel alto: manda el alto.
    const alto = signFrameDistance({ width: 1, height: 2, depth: 0 }, [0, 0, 1], aspect)
    expect(2 * alto * tan).toBeCloseTo(2 * 1.24, 10)
  })

  // Proyecta una esquina con la camara en direction a distance y devuelve su posicion en
  // fraccion del semicuadro: 1 es el borde del cuadro.
  function projectCorner(corner: [number, number, number], direction: [number, number, number], distance: number, aspect: number) {
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    const [zx, zy, zz] = direction
    const flat = Math.hypot(zx, zz)
    const x = [zz / flat, 0, -zx / flat]
    const y = [zy * x[2], zz * x[0] - zx * x[2], -zy * x[0]]
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    const depth = distance - dot(corner, direction)
    return { u: dot(corner, x) / (depth * tan * aspect), v: dot(corner, y) / (depth * tan) }
  }

  function corners(width: number, height: number, depth: number): [number, number, number][] {
    const list: [number, number, number][] = []
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          list.push([(sx * width) / 2, (sy * height) / 2, (sz * depth) / 2])
        }
      }
    }
    return list
  }

  it('girando 360 grados en los dos polares extremos, ninguna esquina sale del cuadro y alguna toca el margen', () => {
    const aspect = 16 / 9
    const inside = 1 / (1 + 2 * SIGN_VIEW.marginRatio)
    // Un panel ancho y el conjunto de 18 letras, las dos formas mas exigentes.
    const volumes = [
      { width: 6.096, height: 2.438, depth: SET.sign.thickness },
      { width: 11, height: 0.9, depth: 0.15 },
    ]
    for (const volume of volumes) {
      for (const polar of [SIGN_VIEW.minPolar, SIGN_VIEW.maxPolar]) {
        for (let azimuth = 0; azimuth < 360; azimuth += 5) {
          const a = (azimuth * Math.PI) / 180
          const direction: [number, number, number] = [Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a)]
          const distance = signFrameDistance(volume, direction, aspect)
          const projected = corners(volume.width, volume.height, volume.depth).map((corner) => projectCorner(corner, direction, distance, aspect))
          const worst = Math.max(...projected.map(({ u, v }) => Math.max(Math.abs(u), Math.abs(v))))
          expect(worst).toBeLessThanOrEqual(inside + 1e-9)
          expect(worst).toBeCloseTo(inside, 9)
        }
      }
    }
  })

  it('de frente el panel queda mas cerca que con el 15 por ciento fijo sobre ancho y alto', () => {
    const aspect = 16 / 9
    const tan = Math.tan((SIGN_VIEW.fovDeg * Math.PI) / 360)
    const direction: [number, number, number] = [0, Math.cos(SIGN_VIEW.startPolar), Math.sin(SIGN_VIEW.startPolar)]
    for (const [width, height] of [[2.438, 0.914], [6.096, 2.438], [2.5, 1], [6, 0.3]]) {
      const previous = Math.max((height * 1.3) / 2 / tan, (width * 1.3) / 2 / (tan * aspect))
      expect(signFrameDistance({ width, height, depth: SET.sign.thickness }, direction, aspect)).toBeLessThan(previous)
    }
  })

  it('la luz del modo cartel es la de estudio del producto: key sin ambiente', () => {
    expect(SIGN_STUDIO_LIGHT.ambient).toBe(0)
    expect(SIGN_STUDIO_LIGHT.keyIntensity).toBeGreaterThan(0)
    expect(SIGN_STUDIO_LIGHT.keyElevationDeg).toBeGreaterThan(0)
  })

  it('en modo vista un metro ocupa metersToWidth del ancho de la foto', () => {
    const aspect = 16 / 9
    const d = photoCameraDistance(0.1, 40, aspect)
    const visibleWidth = 2 * d * Math.tan((40 * Math.PI) / 360) * aspect
    expect(1 / visibleWidth).toBeCloseTo(0.1, 10)
  })

  it('orbitPosition: yaw positivo a la derecha, pitch negativo por debajo, a la distancia pedida', () => {
    const [x, y, z] = orbitPosition(30, -10, 5)
    expect(x).toBeGreaterThan(0)
    expect(y).toBeLessThan(0)
    expect(z).toBeGreaterThan(0)
    expect(Math.hypot(x, y, z)).toBeCloseTo(5, 10)
    expect(orbitPosition(0, 0, 3)).toEqual([0, 0, 3])
  })

  it('lensShift lleva el centro del cartel a (x, y) de la foto', () => {
    expect(lensShift(0.5, 0.5, 800, 450)).toEqual([0, 0])
    const [ox, oy] = lensShift(0.25, 0.2, 800, 450)
    // El target proyecta en el centro de la vista completa: W/2 - ox tiene que dar x por W.
    expect(400 - ox).toBeCloseTo(0.25 * 800, 10)
    expect(225 - oy).toBeCloseTo(0.2 * 450, 10)
  })

  it('el zoom del modo cartel va de 1 a 0,55 de la base y no aleja nunca', () => {
    const range = { min: 1, max: 2.5 }
    expect(signZoomFactor(1, range)).toBe(1)
    expect(signZoomFactor(2.5, range)).toBeCloseTo(0.55, 10)
    expect(signZoomFactor(0, range)).toBe(1)
    expect(signZoomFactor(9, range)).toBeCloseTo(0.55, 10)
  })

  it('el polar del modo cartel nunca llega a verlo desde abajo', () => {
    expect(SIGN_VIEW.maxPolar).toBeLessThan(Math.PI / 2)
    expect(SIGN_VIEW.minPolar).toBe(0.6)
    expect(SIGN_VIEW.startPolar).toBeGreaterThanOrEqual(SIGN_VIEW.minPolar)
    expect(SIGN_VIEW.startPolar).toBeLessThanOrEqual(SIGN_VIEW.maxPolar)
  })
})
