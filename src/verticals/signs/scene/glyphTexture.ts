import { CanvasTexture, SRGBColorSpace, type Texture } from 'three'

// Glifos del texto del cartel, dibujados en runtime (SPEC 12). No se descarga nada:
// una CanvasTexture por caracter, memoizada en un mapa, y la fuente es el stack del
// sistema. Una textura por caracter y no una por palabra porque el visitante escribe
// letra a letra: por palabra se regeneraria en cada tecla, y el mapa por caracter se
// reusa entre palabras y entre los dos clientes.

const SIZE = 128
const FONT_STACK = 'Arial, Helvetica, sans-serif'
// El glifo ocupa esta fraccion del alto del tile. Deja aire arriba y abajo para tildes
// y descendentes sin que el trazo toque el borde de la textura.
export const FONT_RATIO = 0.72

const cache = new Map<string, CanvasTexture>()

// Ancho relativo de cada caracter, con la misma fuente y la misma metrica que el glifo.
// Sirve para componer la palabra sin que las letras queden separadas por igual.
const widths = new Map<string, number>()

function context(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    throw new Error('glyphTexture: el navegador no dio contexto 2d')
  }
  return ctx
}

// Ancho del caracter en unidades de alto de glifo. Se mide una vez por caracter.
export function glyphWidth(char: string): number {
  const known = widths.get(char)
  if (known !== undefined) {
    return known
  }
  const ctx = context()
  ctx.font = `bold ${String(SIZE * FONT_RATIO)}px ${FONT_STACK}`
  const width = ctx.measureText(char).width / (SIZE * FONT_RATIO)
  widths.set(char, width)
  return width
}

// El glifo se dibuja en blanco sobre transparente: el color lo pone el material, que ya
// sale del visual. Asi una misma textura sirve para cualquier material y cualquier tema.
export function glyphTexture(char: string): Texture {
  const known = cache.get(char)
  if (known !== undefined) {
    return known
  }
  const ctx = context()
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.font = `bold ${String(SIZE * FONT_RATIO)}px ${FONT_STACK}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(char, SIZE / 2, SIZE / 2)
  const texture = new CanvasTexture(ctx.canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 1
  cache.set(char, texture)
  return texture
}

// Libera el mapa entero. Lo llama el preview al desmontarse: las texturas viven mientras
// la escena existe y no una por render.
export function disposeGlyphTextures(): void {
  for (const texture of cache.values()) {
    texture.dispose()
  }
  cache.clear()
  widths.clear()
}

export type GlyphLayout = {
  char: string
  // Centro del glifo, en unidades de alto de glifo, con 0 en el centro de la palabra.
  offset: number
  width: number
}

// Reparte los caracteres a lo largo de la palabra respetando el ancho de cada uno.
// Devuelve tambien el ancho total, para que quien la use la escale al espacio que tiene.
export function layoutGlyphs(text: string): { glyphs: GlyphLayout[]; totalWidth: number } {
  const chars = [...text]
  const measured = chars.map((char) => ({ char, width: glyphWidth(char) }))
  const totalWidth = measured.reduce((acc, item) => acc + item.width, 0)
  let cursor = -totalWidth / 2
  const glyphs = measured.map((item) => {
    const offset = cursor + item.width / 2
    cursor += item.width
    return { char: item.char, offset, width: item.width }
  })
  return { glyphs, totalWidth }
}
