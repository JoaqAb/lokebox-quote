import { describe, expect, it } from 'vitest'
import { distanceToInk, letterHaloGrid, letterHaloProfile, rasterize, type Polygon } from './letterHalo'

const square: Polygon = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
]

describe('halo de letras (version 2.7, D86)', () => {
  it('el perfil decrece desde la tinta y llega a 0 con derivada 0 en el borde', () => {
    expect(letterHaloProfile(0)).toBe(1)
    expect(letterHaloProfile(1)).toBe(0)
    expect(letterHaloProfile(1.5)).toBe(0)
    const h = 1e-4
    expect((letterHaloProfile(1) - letterHaloProfile(1 - h)) / h).toBeCloseTo(0, 3)
    // Sin meseta junto a la tinta: la pendiente ahi es la mayor.
    expect(letterHaloProfile(0) - letterHaloProfile(0.05)).toBeGreaterThan(0.09)
    for (let i = 1; i <= 100; i += 1) {
      expect(letterHaloProfile(i / 100)).toBeLessThan(letterHaloProfile((i - 1) / 100))
    }
  })

  it('rasteriza por par e impar, con los huecos de las letras', () => {
    const hole: Polygon = [
      [0.25, 0.25],
      [0.75, 0.25],
      [0.75, 0.75],
      [0.25, 0.75],
    ]
    const mask = rasterize([square, hole], 8, 8, 0, 0, 1 / 8)
    expect(mask[0]).toBe(1)
    expect(mask[3 * 8 + 3]).toBe(0)
    expect([...mask].filter((value) => value === 1)).toHaveLength(64 - 16)
  })

  it('la distancia a la tinta es exacta, en celdas', () => {
    const mask = new Uint8Array(25)
    mask[12] = 1
    const d = distanceToInk(mask, 5, 5)
    expect(d[12]).toBe(0)
    expect(d[13]).toBe(1)
    expect(d[18]).toBeCloseTo(Math.SQRT2, 6)
    expect(d[0]).toBeCloseTo(Math.hypot(2, 2), 6)
  })

  it('la grilla cubre la tinta mas la banda, con 1 sobre la tinta y 0 en el borde', () => {
    const grid = letterHaloGrid([square], 0.5, 20)
    expect(grid.originX).toBeCloseTo(-0.6, 10)
    expect(grid.width * grid.cell).toBeGreaterThanOrEqual(2.2 - 1e-9)
    const at = (x: number, y: number) =>
      grid.alpha[Math.floor((y - grid.originY) / grid.cell) * grid.width + Math.floor((x - grid.originX) / grid.cell)]
    expect(at(0.5, 0.5)).toBe(1)
    // A un cuarto de la banda del borde del cuadrado: (1 - 0,25) al cuadrado, con media celda de error.
    expect(at(1.125, 0.5)).toBeCloseTo(letterHaloProfile(0.25), 1)
    expect(at(1.6, 0.5)).toBe(0)
    expect(grid.alpha[0]).toBe(0)
  })

  it('un texto sin tinta da una grilla vacia', () => {
    expect(letterHaloGrid([], 0.5).alpha).toHaveLength(1)
  })
})
