import { describe, expect, it } from 'vitest'
import { photoTint, type TintRect } from './photoTint'

// Una foto de width x height con un color por pixel.
function image(width: number, height: number, color: (x: number, y: number) => [number, number, number, number]): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      pixels.set(color(x, y), (y * width + x) * 4)
    }
  }
  return pixels
}

const WHOLE: TintRect = { left: 0, top: 0, width: 1, height: 1 }
const luminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

describe('photoTint', () => {
  it('un gris da tinte neutro, sin importar lo claro', () => {
    for (const level of [40, 128, 230]) {
      const tint = photoTint(image(4, 4, () => [level, level, level, 255]), 4, 4, WHOLE)
      tint.forEach((value) => {
        expect(value).toBeCloseTo(1, 6)
      })
    }
  })

  it('devuelve luminancia 1 y conserva la crominancia de un color calido', () => {
    const tint = photoTint(image(2, 2, () => [230, 170, 110, 255]), 2, 2, WHOLE)
    expect(luminance(tint)).toBeCloseTo(1, 6)
    expect(tint[0]).toBeGreaterThan(tint[1])
    expect(tint[1]).toBeGreaterThan(tint[2])
  })

  it('promedia en luz lineal y no en sRGB', () => {
    // Mitad negra y mitad roja pura: en lineal el rojo manda entero y el tinte es rojo puro.
    const tint = photoTint(image(2, 1, (x) => (x === 0 ? [0, 0, 0, 255] : [255, 0, 0, 255])), 2, 1, WHOLE)
    expect(tint[1]).toBe(0)
    expect(tint[2]).toBe(0)
    expect(tint[0]).toBeCloseTo(1 / 0.2126, 6)
  })

  it('mide solo dentro del rectangulo', () => {
    // Izquierda azul, derecha amarilla: el rectangulo de la derecha da amarillo.
    const pixels = image(10, 4, (x) => (x < 5 ? [0, 0, 255, 255] : [255, 255, 0, 255]))
    const right = photoTint(pixels, 10, 4, { left: 0.5, top: 0, width: 0.5, height: 1 })
    expect(right[2]).toBe(0)
    const left = photoTint(pixels, 10, 4, { left: 0, top: 0, width: 0.5, height: 1 })
    expect(left[0]).toBe(0)
    expect(left[1]).toBe(0)
  })

  it('recorta el rectangulo a la foto y saltea pixeles transparentes', () => {
    const pixels = image(4, 4, (x) => (x === 3 ? [255, 0, 0, 0] : [100, 150, 200, 255]))
    const tint = photoTint(pixels, 4, 4, { left: 0.5, top: -0.5, width: 1, height: 2 })
    expect(tint[2]).toBeGreaterThan(tint[0])
  })

  it('sin pixeles o todo negro queda neutro, y lanza si faltan datos', () => {
    expect(photoTint(image(2, 2, () => [0, 0, 0, 255]), 2, 2, WHOLE)).toEqual([1, 1, 1])
    expect(photoTint(image(2, 2, () => [9, 9, 9, 0]), 2, 2, WHOLE)).toEqual([1, 1, 1])
    expect(() => photoTint(new Uint8ClampedArray(4), 2, 2, WHOLE)).toThrow(/photoTint/)
  })
})
