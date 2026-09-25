import { describe, expect, it } from 'vitest'
import { roundTo } from '../../../core/pricing/composePrice'
import { findById } from '../config'
import { testConfigOf } from '../testing'
import type { BoxSelection } from '../types'
import { blankArea, calculateBoxPrice } from './calculateBoxPrice'

// Precio de cajas (SPEC 21.2), contra cuentas hechas a mano en el test.

const foldline = testConfigOf('foldline')
const cajasur = testConfigOf('cajasur')

function areaOf(config: typeof foldline, selection: BoxSelection): number {
  return blankArea(findById(config.options.styles, selection.style, 'estilo').blank, selection, config.units)
}

const fold = (patch: Partial<BoxSelection>): BoxSelection => ({
  style: 'mailer', length: 10, width: 8, height: 4, materialId: 'kraft', printingId: 'one', quantity: 250, ...patch,
})
const sur = (patch: Partial<BoxSelection>): BoxSelection => ({
  style: 'shipping', length: 30, width: 20, height: 15, materialId: 'kraft', printingId: 'un-color', quantity: 100, ...patch,
})

describe('area de plancha', () => {
  it('en pulgadas, pasada a sqft, con la tapa de two-piece', () => {
    // mailer: (10 + 4x4 + 1) x (2x8 + 3x4 + 1,5) = 27 x 29,5 = 796,5 pulg2.
    expect(areaOf(foldline, fold({}))).toBeCloseTo(796.5 / 144, 12)
    // two-piece: fondo (10 + 8 + 0,25) x (8 + 8 + 0,25) = 296,5625, tapa (10 + 3,2 + 0,5) x (8 + 3,2 + 0,5) = 160,29.
    expect(areaOf(foldline, fold({ style: 'two-piece' }))).toBeCloseTo((296.5625 + 160.29) / 144, 12)
    // shipping: (20 + 16 + 1,5) x (8 + 4 + 0,25) = 37,5 x 12,25 = 459,375.
    expect(areaOf(foldline, fold({ style: 'shipping' }))).toBeCloseTo(459.375 / 144, 12)
  })

  it('en centimetros, pasada a m2, con la tapa de two-piece', () => {
    // mailer: (30 + 60 + 2,5) x (40 + 45 + 4) = 92,5 x 89 = 8232,5 cm2.
    expect(areaOf(cajasur, sur({ style: 'mailer' }))).toBeCloseTo(0.82325, 12)
    // two-piece: fondo (30 + 30 + 0,6) x (20 + 30 + 0,6) = 3066,36, tapa (30 + 12 + 1,2) x (20 + 12 + 1,2) = 1434,24.
    expect(areaOf(cajasur, sur({ style: 'two-piece' }))).toBeCloseTo(0.45006, 12)
    // shipping: (60 + 40 + 4) x (20 + 15 + 0,6) = 104 x 35,6 = 3702,4.
    expect(areaOf(cajasur, sur({}))).toBeCloseTo(0.37024, 12)
  })
})

// Un precio completo: material, impresion, armado, descuento por escalon y preparacion por pedido,
// que no se multiplica ni se descuenta.
function expected(area: number, material: number, printing: number, assembly: number, quantity: number, pct: number, setup: number, decimals: number) {
  const unitTotal = area * material + area * printing + assembly
  const total = roundTo(unitTotal * quantity * (1 - pct / 100) + setup, decimals)
  return { unitTotal, total, min: roundTo(total * 0.9, decimals), max: roundTo(total * 1.1, decimals) }
}

describe('precio completo por estilo', () => {
  const cases = [
    { name: 'foldline mailer', config: foldline, sel: fold({}), area: 796.5 / 144, prices: [0.35, 0.15, 0.25, 250, 20, 60] },
    { name: 'foldline two-piece rigido', config: foldline, sel: fold({ style: 'two-piece', materialId: 'rigid', printingId: 'full-inside', quantity: 1000 }), area: 456.8525 / 144, prices: [1.6, 0.8, 0.6, 1000, 35, 180] },
    { name: 'foldline shipping', config: foldline, sel: fold({ style: 'shipping', materialId: 'white', printingId: 'full', quantity: 100 }), area: 459.375 / 144, prices: [0.5, 0.45, 0.1, 100, 10, 120] },
    { name: 'cajasur mailer', config: cajasur, sel: sur({ style: 'mailer', materialId: 'blanco', printingId: 'full', quantity: 500 }), area: 0.82325, prices: [3600, 3300, 170, 500, 28, 81000] },
    { name: 'cajasur two-piece rigido', config: cajasur, sel: sur({ style: 'two-piece', materialId: 'rigido', printingId: 'full-interior', quantity: 250 }), area: 0.45006, prices: [11600, 5800, 410, 250, 20, 122000] },
    { name: 'cajasur shipping', config: cajasur, sel: sur({}), area: 0.37024, prices: [2500, 1100, 70, 100, 10, 40000] },
  ]
  for (const item of cases) {
    it(item.name, () => {
      const [material, printing, assembly, quantity, pct, setup] = item.prices
      const decimals = item.config.currency.decimals
      const want = expected(item.area, material, printing, assembly, quantity, pct, setup, decimals)
      const result = calculateBoxPrice(item.config, item.sel)
      expect(result.unitTotal).toBeCloseTo(want.unitTotal, 9)
      expect(result.total).toBe(want.total)
      expect(result.min).toBe(want.min)
      expect(result.max).toBe(want.max)
      expect(result.discountPct).toBe(pct)
      expect(result.quantity).toBe(quantity)
      expect(result.blankArea).toBeCloseTo(item.area, 12)
      expect(result.lines.map((line) => line.id)).toEqual(['material', 'printing', 'assembly', 'discount', 'setup'])
      expect(result.lines.at(-1)?.amount).toBe(setup)
    })
  }
})

describe('escalones y lineas', () => {
  it('el escalon minimo no lleva linea de descuento; los demas llevan la del core', () => {
    const min = calculateBoxPrice(foldline, fold({ quantity: 50 }))
    expect(min.discountPct).toBe(0)
    expect(min.lines.some((line) => line.id === 'discount')).toBe(false)
    for (const [quantity, pct] of [[100, 10], [250, 20], [500, 28], [1000, 35]]) {
      const result = calculateBoxPrice(foldline, fold({ quantity }))
      const discount = result.lines.find((line) => line.id === 'discount')
      expect(discount?.labelKey).toBe('lineDiscount')
      expect(discount?.detailValues).toEqual({ id: 'discount', pct })
      expect(discount?.amount).toBe(-roundTo((result.unitTotal * pct) / 100, 2))
    }
  })

  it('la impresion en 0 entra; armado y preparacion en 0 no entran', () => {
    const config = testConfigOf('foldline')
    config.options.styles[0].assembly = 0
    const result = calculateBoxPrice(config, fold({ printingId: 'none', quantity: 50 }))
    expect(result.lines.map((line) => line.id)).toEqual(['material', 'printing'])
    expect(result.lines[1].amount).toBe(0)
    expect(result.lines[1].detailValues).toEqual({ id: 'printing', blankArea: 796.5 / 144, unitPrice: 0 })
  })

  it('redondea a 2 en foldline y a 0 en cajasur, con el total en precision completa', () => {
    const f = calculateBoxPrice(foldline, fold({ quantity: 50 }))
    // 796,5/144 x 0,5 + 0,25 por 50 mas 60: el total sale de la suma sin redondear.
    const fExact = ((796.5 / 144) * 0.5 + 0.25) * 50 + 60
    expect(f.total).toBe(roundTo(fExact, 2))
    expect(f.lines.every((line) => roundTo(line.amount, 2) === line.amount)).toBe(true)
    const s = calculateBoxPrice(cajasur, sur({ quantity: 50 }))
    // Kraft 2500 mas 1 color 1100 por m2, armado 70, preparacion 40000.
    const sExact = (0.37024 * (2500 + 1100) + 70) * 50 + 40000
    expect(s.total).toBe(Math.round(sExact))
    expect(s.lines.map((line) => line.amount)).toEqual([926, 407, 70, 40000])
    // Sumar las lineas ya redondeadas daria otro total: 926 + 407 + 70 = 1403 por 50 mas 40000.
    expect(s.total).not.toBe(1403 * 50 + 40000)
  })

  it('lanza con id inexistente, material que no vale, medida fuera de rango y cantidad fuera de escalones', () => {
    expect(() => calculateBoxPrice(foldline, fold({ style: 'tube' }))).toThrow(/tube/)
    expect(() => calculateBoxPrice(foldline, fold({ materialId: 'foam' }))).toThrow(/foam/)
    expect(() => calculateBoxPrice(foldline, fold({ printingId: 'gold' }))).toThrow(/gold/)
    expect(() => calculateBoxPrice(foldline, fold({ materialId: 'rigid' }))).toThrow(/rigid/)
    expect(() => calculateBoxPrice(foldline, fold({ length: 24.5 }))).toThrow(/24\.5/)
    expect(() => calculateBoxPrice(foldline, fold({ height: 0.5 }))).toThrow(/0\.5/)
    expect(() => calculateBoxPrice(foldline, fold({ quantity: 300 }))).toThrow(/300/)
  })
})
