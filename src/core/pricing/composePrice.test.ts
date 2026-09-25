import { describe, expect, it } from 'vitest'
import type { PriceComponent, PriceInput } from '../types'
import { DISCOUNT_LABEL_KEY, DISCOUNT_LINE_ID, composePrice, roundTo } from './composePrice'

// SPEC 6.3 (D134). Los componentes son de un rubro inventado: el core no conoce ninguno.

function component(id: string, cost: number, detailValues?: unknown): PriceComponent {
  return {
    line: { id, labelKey: `line_${id}`, detail: `detalle ${id}`, ...(detailValues === undefined ? {} : { detailValues }) },
    cost,
  }
}

function input(overrides: Partial<PriceInput> = {}): PriceInput {
  return {
    decimals: 0,
    quantity: 1,
    unit: [component('a', 100, { raw: 1 }), component('b', 50.4)],
    discounts: [],
    order: [],
    rangePct: 10,
    ...overrides,
  }
}

describe('composePrice', () => {
  it('sin descuentos: suma los componentes por unidad, multiplica por la cantidad y arma el rango', () => {
    const result = composePrice(input({ quantity: 3 }))
    expect(result).toStrictEqual({
      unitTotal: 150.4,
      subtotal: 451.20000000000005,
      discountPct: 0,
      total: 451,
      min: 406,
      max: 496,
      lines: [
        { id: 'a', labelKey: 'line_a', detail: 'detalle a', detailValues: { raw: 1 }, amount: 100 },
        { id: 'b', labelKey: 'line_b', detail: 'detalle b', amount: 50 },
      ],
    })
  })

  it('con tramos: toma el de mayor minQty que cumple, nunca dos, y la linea de descuento va por unidad', () => {
    const discounts = [
      { minQty: 2, pct: 5 },
      { minQty: 5, pct: 10 },
    ]
    expect(composePrice(input({ quantity: 1, discounts })).discountPct).toBe(0)
    expect(composePrice(input({ quantity: 4, discounts })).discountPct).toBe(5)
    const result = composePrice(input({ quantity: 5, discounts }))
    expect(result.discountPct).toBe(10)
    expect(result.subtotal).toBe(752)
    expect(result.total).toBe(roundTo(752 * 0.9, 0))
    expect(result.lines).toHaveLength(3)
    expect(result.lines[2]).toStrictEqual({
      id: DISCOUNT_LINE_ID,
      labelKey: DISCOUNT_LABEL_KEY,
      detail: '10%',
      amount: -15,
      detailValues: { id: DISCOUNT_LINE_ID, pct: 10 },
    })
    expect(DISCOUNT_LABEL_KEY).toBe('lineDiscount')
  })

  it('los componentes por pedido no se multiplican ni se descuentan, y van al final del desglose', () => {
    const discounts = [{ minQty: 2, pct: 10 }]
    const result = composePrice(input({ quantity: 4, discounts, order: [component('setup', 80.6)] }))
    expect(result.unitTotal).toBe(150.4)
    expect(result.subtotal).toBe(601.6)
    // 601,6 por 0,9 mas 80,6, redondeado una sola vez.
    expect(result.total).toBe(Math.round(601.6 * 0.9 + 80.6))
    expect(result.min).toBe(roundTo(result.total * 0.9, 0))
    expect(result.max).toBe(roundTo(result.total * 1.1, 0))
    expect(result.lines.map((line) => line.id)).toEqual(['a', 'b', DISCOUNT_LINE_ID, 'setup'])
    expect(result.lines[3].amount).toBe(81)
  })

  it('una linea de costo 0 entra si la vertical la pasa', () => {
    const result = composePrice(input({ unit: [component('a', 100), component('cero', 0)] }))
    expect(result.lines.map((line) => line.id)).toEqual(['a', 'cero'])
    expect(result.lines[1].amount).toBe(0)
    expect(Object.is(result.lines[1].amount, 0)).toBe(true)
  })

  it('una cantidad invalida lanza, con el valor en el mensaje', () => {
    for (const quantity of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => composePrice(input({ quantity })), String(quantity)).toThrow(`llego: ${String(quantity)}`)
    }
  })

  it('una clave opcional ausente va ausente, nunca en undefined', () => {
    const result = composePrice(input({ discounts: [{ minQty: 1, pct: 0 }] }))
    // Con pct 0 no hay linea de descuento.
    expect(result.lines).toHaveLength(2)
    expect('detailValues' in result.lines[1]).toBe(false)
    expect(Object.keys(result).sort()).toEqual(['discountPct', 'lines', 'max', 'min', 'subtotal', 'total', 'unitTotal'])
  })

  it('redondea a los decimales de la moneda, cada importe y el total', () => {
    const result = composePrice(input({ decimals: 2, unit: [component('a', 10.005), component('b', 0.3333)], quantity: 3 }))
    expect(result.lines.map((line) => line.amount)).toEqual([roundTo(10.005, 2), 0.33])
    expect(result.total).toBe(roundTo((10.005 + 0.3333) * 3, 2))
  })
})
