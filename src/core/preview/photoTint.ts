// Casado de tono (SPEC 12, version 2.5, D77): la crominancia de la foto alrededor del anclaje,
// para tenir la luz del cartel en modo vista. Funcion pura, sin React ni three: recibe los pixeles
// RGBA de la foto, 8 bits en sRGB como los da getImageData, y un rectangulo en fraccion de la foto.
// Devuelve el color medio en luz lineal, normalizado a luminancia 1: es solo el tinte, la
// intensidad la sigue poniendo el light de la foto.

// Rectangulo en fraccion del ancho y del alto de la foto, con origen arriba a la izquierda.
export type TintRect = { left: number; top: number; width: number; height: number }

export type Tint = [number, number, number]

// Coeficientes de luminancia de Rec. 709, los de la luz lineal sRGB.
const LUMA: Tint = [0.2126, 0.7152, 0.0722]
const NEUTRAL: Tint = [1, 1, 1]

function srgbToLinear(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

// Tabla de los 256 valores, para no elevar a 2,4 por pixel.
const LINEAR = Array.from({ length: 256 }, (_unused, value) => srgbToLinear(value))

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function photoTint(pixels: ArrayLike<number>, width: number, height: number, rect: TintRect): Tint {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) {
    throw new Error(`photoTint: faltan pixeles para ${String(width)} x ${String(height)}`)
  }
  const x0 = Math.floor(clamp01(rect.left) * width)
  const y0 = Math.floor(clamp01(rect.top) * height)
  const x1 = Math.ceil(clamp01(rect.left + rect.width) * width)
  const y1 = Math.ceil(clamp01(rect.top + rect.height) * height)
  const sum: Tint = [0, 0, 0]
  let count = 0
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * width + x) * 4
      // Un pixel transparente no es foto.
      if (pixels[index + 3] === 0) {
        continue
      }
      sum[0] += LINEAR[pixels[index]]
      sum[1] += LINEAR[pixels[index + 1]]
      sum[2] += LINEAR[pixels[index + 2]]
      count += 1
    }
  }
  const luminance = sum[0] * LUMA[0] + sum[1] * LUMA[1] + sum[2] * LUMA[2]
  // Sin pixeles, o todo negro: no hay tinte que medir y la luz queda neutra.
  if (count === 0 || luminance <= 0) {
    return NEUTRAL
  }
  return [sum[0] / luminance, sum[1] / luminance, sum[2] / luminance]
}
