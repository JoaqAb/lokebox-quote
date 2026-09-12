import { describe, expect, it } from 'vitest'
import { getClient } from '../../clients'
import { priceRulesFromClient } from '../clientConfig'
import type { PriceRules, SignSelection } from '../types'
import { calculatePrice } from './calculatePrice'

function rulesFor(slug: string): PriceRules {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return priceRulesFromClient(client)
}

const northline = rulesFor('northline')
const norte = rulesFor('norte')

function selection(overrides: Partial<SignSelection> = {}): SignSelection {
  return {
    type: 'facade',
    width: 8,
    height: 3,
    materialId: 'pvc',
    lightingId: 'front',
    installation: true,
    quantity: 1,
    ...overrides,
  }
}

type Case = {
  n: number
  name: string
  rules: PriceRules
  selection: SignSelection
  total: number
  min: number
  max: number
}

// Los siete casos de la seccion 10 de TAREA_001. Los numeros son exactos.
const CASES: Case[] = [
  {
    n: 1,
    name: 'facade, 8 x 3, pvc, front, instalacion si, qty 1',
    rules: northline,
    selection: selection(),
    total: 2390,
    min: 2199,
    max: 2581,
  },
  {
    n: 2,
    name: 'igual al 1 con qty 2',
    rules: northline,
    selection: selection({ quantity: 2 }),
    total: 4541,
    min: 4178,
    max: 4904,
  },
  {
    n: 3,
    name: 'igual al 1 con qty 5',
    rules: northline,
    selection: selection({ quantity: 5 }),
    total: 10755,
    min: 9895,
    max: 11615,
  },
  {
    n: 4,
    name: 'totem, 3 x 6, acrylic, back, instalacion si, qty 2',
    rules: northline,
    selection: selection({
      type: 'totem',
      width: 3,
      height: 6,
      materialId: 'acrylic',
      lightingId: 'back',
      quantity: 2,
    }),
    total: 5700,
    min: 5244,
    max: 6156,
  },
  {
    n: 5,
    name: 'facade, 8 x 3, aluminum, none, instalacion no, qty 1',
    rules: northline,
    selection: selection({ materialId: 'aluminum', lightingId: 'none', installation: false }),
    total: 600,
    min: 552,
    max: 648,
  },
  {
    n: 6,
    name: 'norte: facade, 2.5 x 1, pvc, front, instalacion si, qty 1',
    rules: norte,
    selection: selection({ width: 2.5, height: 1 }),
    total: 1781000,
    min: 1638520,
    max: 1923480,
  },
  {
    n: 7,
    name: 'norte: totem, 2 x 1.2, acrylic, back, instalacion si, qty 5',
    rules: norte,
    selection: selection({
      type: 'totem',
      width: 2,
      height: 1.2,
      materialId: 'acrylic',
      lightingId: 'back',
      quantity: 5,
    }),
    total: 12083400,
    min: 11116728,
    max: 13050072,
  },
]

describe('calculatePrice, casos de la tabla', () => {
  for (const testCase of CASES) {
    it(`caso ${String(testCase.n)}: ${testCase.name}`, () => {
      const result = calculatePrice(testCase.rules, testCase.selection)
      expect(result.total).toBe(testCase.total)
      expect(result.min).toBe(testCase.min)
      expect(result.max).toBe(testCase.max)
    })
  }
})

describe('calculatePrice, tramos de descuento', () => {
  const expected: { quantity: number; pct: number }[] = [
    { quantity: 1, pct: 0 },
    { quantity: 2, pct: 5 },
    { quantity: 4, pct: 5 },
    { quantity: 5, pct: 10 },
    { quantity: 10, pct: 10 },
  ]

  for (const item of expected) {
    it(`qty ${String(item.quantity)} da ${String(item.pct)}%`, () => {
      const result = calculatePrice(northline, selection({ quantity: item.quantity }))
      expect(result.discountPct).toBe(item.pct)
    })
  }

  it('nunca acumula dos tramos', () => {
    const result = calculatePrice(northline, selection({ quantity: 10 }))
    const discountLines = result.lines.filter((line) => line.id === 'discount')
    expect(discountLines).toHaveLength(1)
    // 2390 por unidad, 10 unidades, 10% de descuento.
    expect(result.subtotal).toBe(23900)
    expect(result.total).toBe(21510)
  })
})

describe('calculatePrice, lineas del desglose', () => {
  it('caso 5: dos lineas, material y lighting con importe 0, sin type ni installation ni discount', () => {
    const result = calculatePrice(
      northline,
      selection({ materialId: 'aluminum', lightingId: 'none', installation: false }),
    )
    expect(result.lines).toHaveLength(2)
    expect(result.lines.map((line) => line.id)).toEqual(['material', 'lighting'])
    expect(result.lines[0].amount).toBe(600)
    // Decision: la linea de iluminacion se incluye siempre, tambien con importe 0.
    expect(result.lines[1].amount).toBe(0)
  })

  it('caso 1: la suma de las lineas positivas es igual a unitTotal', () => {
    const result = calculatePrice(northline, selection())
    const positives = result.lines
      .filter((line) => line.amount > 0)
      .reduce((acc, line) => acc + line.amount, 0)
    expect(positives).toBe(result.unitTotal)
    expect(result.unitTotal).toBe(2390)
  })

  it('las claves de texto y los detalles son los esperados', () => {
    const result = calculatePrice(northline, selection({ type: 'totem', quantity: 2 }))
    expect(result.area).toBe(24)
    expect(result.lines).toEqual([
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: '24 x 15',
        amount: 360,
        detailValues: { id: 'material', area: 24, unitPrice: 15 },
      },
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: '24 x 60',
        amount: 1440,
        detailValues: { id: 'lighting', area: 24, unitPrice: 60 },
      },
      {
        id: 'type',
        labelKey: 'lineType',
        detail: '400',
        amount: 400,
        detailValues: { id: 'type', fixed: 400 },
      },
      {
        id: 'installation',
        labelKey: 'lineInstallation',
        detail: '350 + 24 x 10',
        amount: 590,
        detailValues: { id: 'installation', fixed: 350, perArea: 10, area: 24 },
      },
      {
        id: 'discount',
        labelKey: 'lineDiscount',
        detail: '5%',
        amount: -140,
        detailValues: { id: 'discount', pct: 5 },
      },
    ])
  })

  it('los importes de las lineas son por unidad, no por cantidad', () => {
    const one = calculatePrice(northline, selection())
    const five = calculatePrice(northline, selection({ quantity: 5 }))
    expect(five.lines[0].amount).toBe(one.lines[0].amount)
    expect(five.subtotal).toBe(five.unitTotal * 5)
  })
})

describe('calculatePrice, errores', () => {
  it('materialId inexistente lanza y nombra el id', () => {
    expect(() => calculatePrice(northline, selection({ materialId: 'madera' }))).toThrow('madera')
  })

  it('lightingId inexistente lanza y nombra el id', () => {
    expect(() => calculatePrice(northline, selection({ lightingId: 'neon' }))).toThrow('neon')
  })

  it('type inexistente lanza y nombra el id', () => {
    expect(() => calculatePrice(northline, selection({ type: 'banner' }))).toThrow('banner')
  })

  it('quantity 0 lanza y nombra el valor', () => {
    expect(() => calculatePrice(northline, selection({ quantity: 0 }))).toThrow(/quantity.*0/)
  })

  it('width 0 lanza y nombra el valor', () => {
    expect(() => calculatePrice(northline, selection({ width: 0 }))).toThrow(/width.*0/)
  })
})

describe('calculatePrice, pureza', () => {
  it('dos llamadas con el mismo input dan resultados iguales', () => {
    const input = selection({ quantity: 3 })
    expect(calculatePrice(northline, input)).toEqual(calculatePrice(northline, input))
  })

  it('no muta selection ni rules', () => {
    const input = selection({ quantity: 3 })
    const inputBefore = structuredClone(input)
    const rulesBefore = structuredClone(northline)
    calculatePrice(northline, input)
    expect(input).toEqual(inputBefore)
    expect(northline).toEqual(rulesBefore)
  })
})

// detailValues: los numeros crudos que la UI formatea (SPEC 6, version 1.5).
describe('detailValues', () => {
  const completa = selection({
    type: 'totem',
    lightingId: 'back',
    installation: true,
    quantity: 5,
  })

  // 9.1
  it('cada linea trae detailValues con su id y sus numeros crudos', () => {
    const result = calculatePrice(northline, completa)
    const porId = new Map(result.lines.map((line) => [line.id, line.detailValues]))
    expect(porId.get('material')).toEqual({ id: 'material', area: 24, unitPrice: 15 })
    expect(porId.get('lighting')).toEqual({ id: 'lighting', area: 24, unitPrice: 80 })
    expect(porId.get('type')).toEqual({ id: 'type', fixed: 400 })
    expect(porId.get('installation')).toEqual({
      id: 'installation',
      fixed: 350,
      perArea: 10,
      area: 24,
    })
    expect(porId.get('discount')).toEqual({ id: 'discount', pct: 10 })
  })

  // 9.1
  it('ninguna linea emitida se queda sin detailValues, en los dos clientes', () => {
    for (const [slug, rules] of [
      ['northline', northline],
      ['norte', norte],
    ] as const) {
      const result = calculatePrice(rules, completa)
      expect(result.lines).toHaveLength(5)
      for (const line of result.lines) {
        expect(line.detailValues, `${slug}: linea ${line.id}`).toBeDefined()
        expect(line.detailValues?.id).toBe(line.id)
      }
    }
  })

  // 9.2
  it('el area de detailValues es la misma que result.area, sin redondear', () => {
    const result = calculatePrice(norte, selection({ width: 1.75, height: 0.9 }))
    const material = result.lines.find((line) => line.id === 'material')?.detailValues
    expect(material).toEqual({ id: 'material', area: result.area, unitPrice: 109000 })
    // 1.575 tiene tres decimales: el area viaja cruda, no redondeada a dos como antes.
    expect(result.area).toBe(1.575)
    expect(result.area).not.toBe(Math.round(result.area * 100) / 100)
  })

  // 9.3
  it('los numeros de detailValues no dependen del locale ni de la moneda', () => {
    const otraMoneda: PriceRules = {
      ...northline,
      currency: { code: 'EUR', symbol: '€', decimals: 2 },
    }
    const conUsd = calculatePrice(northline, selection())
    const conEur = calculatePrice(otraMoneda, selection())
    expect(conEur.lines[0].detailValues).toEqual(conUsd.lines[0].detailValues)
  })
})
