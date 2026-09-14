import type { BufferGeometry } from 'three'
import { Font, type FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { layoutLetters, type TextBounds } from './sceneGeometry'

// El typeface del texto 3D del cartel (SPEC 12, version 1.14): Archivo Black subsetado a
// A a Z, 0 a 9 y espacio. Puro de React: la carga por red la hace el preview.
// Todas las medidas de este modulo van en unidades de alto de mayuscula (el alto de la H),
// asi el alto de letra de la seleccion es directamente la escala de la letra.

export const TYPEFACE_SRC = '/assets/quote/fonts/archivo-black-subset.typeface.json'

// Geometria de cada letra: bisel chico y pocas curvas, para que 18 letras sigan livianas.
// bevelSize va en alto de mayuscula y bevelThickness en fraccion de la profundidad total.
export const TEXT_3D = {
  capChar: 'H',
  curveSegments: 4,
  bevelSize: 0.025,
  bevelThickness: 0.08,
  bevelSegments: 2,
} as const

// Orden de los materiales de cada letra: la cara frontal, los cantos y la cara trasera.
export const TEXT_FACE = { front: 0, sides: 1, back: 2 } as const

export type Typeface = {
  font: Font
  // Alto de la H en unidades del typeface.
  capUnits: number
}

// Numeros del contorno de un glifo, por comando: m y l llevan un punto, q dos y b tres.
// Los puntos de control encierran a la curva, asi el contorno que dan nunca queda corto.
function outlinePoints(outline: string): [number, number][] {
  const tokens = outline.split(' ').filter((token) => token.length > 0)
  const counts: Record<string, number> = { m: 1, l: 1, q: 2, b: 3 }
  const points: [number, number][] = []
  let index = 0
  while (index < tokens.length) {
    const count = counts[tokens[index]]
    if (count === undefined) {
      throw new Error(`typeface: comando de contorno desconocido "${tokens[index]}"`)
    }
    for (let point = 0; point < count; point += 1) {
      points.push([Number(tokens[index + 1 + point * 2]), Number(tokens[index + 2 + point * 2])])
    }
    index += 1 + count * 2
  }
  return points
}

export function createTypeface(data: FontData): Typeface {
  const cap = data.glyphs[TEXT_3D.capChar]
  if (cap === undefined || cap.o === undefined) {
    throw new Error(`typeface: falta el glifo "${TEXT_3D.capChar}", que da el alto de mayuscula`)
  }
  if (data.glyphs[' '] === undefined) {
    throw new Error('typeface: falta el espacio')
  }
  const capUnits = Math.max(...outlinePoints(cap.o).map(([, y]) => y))
  return { font: new Font(data), capUnits }
}

function glyphOf(typeface: Typeface, char: string) {
  return typeface.font.data.glyphs[char]
}

// Avance del caracter en alto de mayuscula. Un caracter que el typeface no tiene ocupa el
// avance del espacio: no dibuja letra, pero la palabra no se come el hueco.
export function glyphAdvance(typeface: Typeface, char: string): number {
  const glyph = glyphOf(typeface, char) ?? glyphOf(typeface, ' ')
  return glyph.ha / typeface.capUnits
}

// Contorno de un glifo tal como se dibuja: la caja de su geometria, ya centrada, con el
// bisel. Sale de la geometria y no del trazo porque el bisel de three avanza mas que
// bevelSize en las puntas agudas (A, V, W). null si el caracter no dibuja.
export function glyphBounds(typeface: Typeface, char: string): TextBounds | null {
  const geometry = glyphGeometry(typeface, char)
  if (geometry === null) {
    return null
  }
  if (geometry.boundingBox === null) {
    geometry.computeBoundingBox()
  }
  const box = geometry.boundingBox
  if (box === null) {
    return null
  }
  return { minX: box.min.x, maxX: box.max.x, minY: box.min.y, maxY: box.max.y }
}

// Contorno real de un texto compuesto con layoutLetters a alto 1. null si no dibuja nada.
export function textBounds(typeface: Typeface, text: string): TextBounds | null {
  const { boxes } = layoutLetters(text, 1, (char) => glyphAdvance(typeface, char))
  const bounds: TextBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  for (const box of boxes) {
    const glyph = glyphBounds(typeface, box.char)
    if (glyph !== null) {
      bounds.minX = Math.min(bounds.minX, box.x + glyph.minX)
      bounds.maxX = Math.max(bounds.maxX, box.x + glyph.maxX)
      bounds.minY = Math.min(bounds.minY, glyph.minY)
      bounds.maxY = Math.max(bounds.maxY, glyph.maxY)
    }
  }
  return bounds.minX === Infinity ? null : bounds
}

// Arma la geometria de un caracter en unidades: alto de mayuscula 1, profundidad total 1
// con el bisel incluido, centrada en su avance, en la mayuscula y en la profundidad.
// Las tapas vienen en un solo grupo; se parten en cara trasera (primera mitad, la de z
// menor) y cara frontal (segunda mitad), asi en back emiten los cantos y la trasera.
export function buildGlyphGeometry(typeface: Typeface, char: string): BufferGeometry | null {
  const glyph = glyphOf(typeface, char)
  if (glyph?.o === undefined || glyph.o.length === 0) {
    return null
  }
  const size = typeface.font.data.resolution / typeface.capUnits
  const thickness = TEXT_3D.bevelThickness
  const geometry = new TextGeometry(char, {
    font: typeface.font,
    size,
    depth: 1 - 2 * thickness,
    curveSegments: TEXT_3D.curveSegments,
    bevelEnabled: true,
    bevelSize: TEXT_3D.bevelSize,
    bevelThickness: thickness,
    bevelSegments: TEXT_3D.bevelSegments,
  })
  geometry.translate(-glyph.ha / typeface.capUnits / 2, -0.5, thickness - 0.5)

  const groups = geometry.groups.map((group) => ({ ...group }))
  geometry.clearGroups()
  for (const group of groups) {
    if (group.materialIndex === 0) {
      const half = group.count / 2
      geometry.addGroup(group.start, half, TEXT_FACE.back)
      geometry.addGroup(group.start + half, half, TEXT_FACE.front)
    } else {
      geometry.addGroup(group.start, group.count, TEXT_FACE.sides)
    }
  }
  return geometry
}

// Una geometria por caracter, memoizada: el visitante escribe letra a letra y las letras
// repetidas comparten geometria. Vive mientras vive el preview.
const cache = new Map<string, BufferGeometry | null>()

export function glyphGeometry(typeface: Typeface, char: string): BufferGeometry | null {
  if (!cache.has(char)) {
    cache.set(char, buildGlyphGeometry(typeface, char))
  }
  return cache.get(char) ?? null
}

export function disposeGlyphGeometries(): void {
  for (const geometry of cache.values()) {
    geometry?.dispose()
  }
  cache.clear()
}
