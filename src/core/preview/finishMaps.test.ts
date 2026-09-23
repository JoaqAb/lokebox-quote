import { describe, expect, it } from 'vitest'
import { FINISHES, FINISH_MAP_SIZE, FINISH_RECIPES, buildFinishMaps, finishHeights, isFinish } from './finishMaps'

const SIZE = 64

// Diferencia media entre texeles vecinos en una direccion, envolviendo en el borde.
function meanStep(heights: Float32Array, size: number, dx: number, dy: number): number {
  let sum = 0
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const next = heights[((y + dy) % size) * size + ((x + dx) % size)]
      sum += Math.abs(next - heights[y * size + x])
    }
  }
  return sum / (size * size)
}

describe('finishMaps', () => {
  it('el mapa es potencia de dos, para tener mipmaps', () => {
    expect(Math.log2(FINISH_MAP_SIZE) % 1).toBe(0)
  })

  it('es determinista: dos corridas dan los mismos bytes', () => {
    for (const finish of FINISHES) {
      const a = buildFinishMaps(finish, SIZE)
      const b = buildFinishMaps(finish, SIZE)
      expect(a.roughness).toEqual(b.roughness)
      expect(a.normal).toEqual(b.normal)
    }
  })

  it('los tres acabados dan mapas distintos', () => {
    const [foam, brushed, polished] = FINISHES.map((finish) => buildFinishMaps(finish, SIZE).normal)
    expect(foam).not.toEqual(brushed)
    expect(brushed).not.toEqual(polished)
    expect(foam).not.toEqual(polished)
  })

  it('las alturas quedan en [0, 1] y el roughness entre 1 - roughnessDrop y 1', () => {
    for (const finish of FINISHES) {
      const heights = finishHeights(finish, SIZE)
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(0)
      expect(Math.max(...heights)).toBeLessThanOrEqual(1)
      const { roughness } = buildFinishMaps(finish, SIZE)
      const green = Array.from({ length: SIZE * SIZE }, (_unused, index) => roughness[index * 4 + 1])
      expect(Math.min(...green)).toBeGreaterThanOrEqual(Math.floor((1 - FINISH_RECIPES[finish].roughnessDrop) * 255))
      expect(Math.max(...green)).toBeLessThanOrEqual(255)
    }
  })

  it('repite sin costura: el salto del borde al texel opuesto es como el de adentro', () => {
    for (const finish of FINISHES) {
      const heights = finishHeights(finish, SIZE)
      const inner = meanStep(heights, SIZE, 1, 0) + meanStep(heights, SIZE, 0, 1)
      let seam = 0
      for (let i = 0; i < SIZE; i += 1) {
        seam += Math.abs(heights[i * SIZE + SIZE - 1] - heights[i * SIZE])
        seam += Math.abs(heights[(SIZE - 1) * SIZE + i] - heights[i])
      }
      expect(seam / SIZE).toBeLessThan(inner * 3)
    }
  })

  it('el cepillado tiene vetas horizontales: cambia mucho mas en y que en x', () => {
    const heights = finishHeights('brushed', FINISH_MAP_SIZE)
    const alongX = meanStep(heights, FINISH_MAP_SIZE, 1, 0)
    const alongY = meanStep(heights, FINISH_MAP_SIZE, 0, 1)
    expect(alongY).toBeGreaterThan(alongX * 5)
  })

  it('la espuma es pareja en las dos direcciones', () => {
    const heights = finishHeights('foam', FINISH_MAP_SIZE)
    const ratio = meanStep(heights, FINISH_MAP_SIZE, 1, 0) / meanStep(heights, FINISH_MAP_SIZE, 0, 1)
    expect(ratio).toBeGreaterThan(0.8)
    expect(ratio).toBeLessThan(1.25)
  })

  it('el pulido es el mas plano de los tres', () => {
    const tilt = (finish: (typeof FINISHES)[number]) => {
      const { normal } = buildFinishMaps(finish, SIZE)
      let sum = 0
      for (let index = 0; index < SIZE * SIZE; index += 1) {
        sum += 255 - normal[index * 4 + 2]
      }
      return sum / (SIZE * SIZE)
    }
    expect(tilt('polished')).toBeLessThan(tilt('foam'))
    expect(tilt('polished')).toBeLessThan(tilt('brushed'))
  })

  it('los normales son unitarios dentro del redondeo a bytes', () => {
    for (const finish of FINISHES) {
      const { normal } = buildFinishMaps(finish, SIZE)
      for (let index = 0; index < SIZE * SIZE; index += 97) {
        const n = [0, 1, 2].map((channel) => (normal[index * 4 + channel] / 255) * 2 - 1)
        expect(Math.hypot(n[0], n[1], n[2])).toBeCloseTo(1, 1)
      }
    }
  })

  it('isFinish acepta los tres acabados y nada mas', () => {
    expect(FINISHES.every((finish) => isFinish(finish))).toBe(true)
    expect(isFinish('glossy')).toBe(false)
  })
})
