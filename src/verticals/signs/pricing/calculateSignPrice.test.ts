import { describe, expect, it } from 'vitest'
import { priceRulesFromClient } from '../config'
import type { PriceRules, SignSelection } from '../types'
import { calculateSignPrice, countLetters } from './calculateSignPrice'
import { signsClientOf } from '../testing'

function rulesFor(slug: string): PriceRules {
  return priceRulesFromClient(signsClientOf(slug))
}

const northline = rulesFor('northline')
const norte = rulesFor('norte')

function selection(overrides: Partial<SignSelection> = {}): SignSelection {
  return {
    type: 'facade',
    text: 'NORTHLINE',
    width: 8,
    height: 3,
    letterHeight: 1,
    depthId: 'd2',
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
      const result = calculateSignPrice(testCase.rules, testCase.selection)
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
      const result = calculateSignPrice(northline, selection({ quantity: item.quantity }))
      expect(result.discountPct).toBe(item.pct)
    })
  }

  it('nunca acumula dos tramos', () => {
    const result = calculateSignPrice(northline, selection({ quantity: 10 }))
    const discountLines = result.lines.filter((line) => line.id === 'discount')
    expect(discountLines).toHaveLength(1)
    // 2390 por unidad, 10 unidades, 10% de descuento.
    expect(result.subtotal).toBe(23900)
    expect(result.total).toBe(21510)
  })
})

describe('calculatePrice, lineas del desglose', () => {
  it('caso 5: dos lineas, material y lighting con importe 0, sin type ni installation ni discount', () => {
    const result = calculateSignPrice(
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
    const result = calculateSignPrice(northline, selection())
    const positives = result.lines
      .filter((line) => line.amount > 0)
      .reduce((acc, line) => acc + line.amount, 0)
    expect(positives).toBe(result.unitTotal)
    expect(result.unitTotal).toBe(2390)
  })

  it('las claves de texto y los detalles son los esperados', () => {
    const result = calculateSignPrice(northline, selection({ type: 'totem', quantity: 2 }))
    expect(result.area).toBe(24)
    expect(result.lines).toEqual([
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: '24 x 15',
        amount: 360,
        detailValues: { id: 'material', mode: 'area', area: 24, unitPrice: 15 },
      },
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: '24 x 60',
        amount: 1440,
        detailValues: { id: 'lighting', mode: 'area', area: 24, unitPrice: 60 },
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
        detailValues: { id: 'installation', mode: 'area', fixed: 350, perArea: 10, area: 24 },
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
    const one = calculateSignPrice(northline, selection())
    const five = calculateSignPrice(northline, selection({ quantity: 5 }))
    expect(five.lines[0].amount).toBe(one.lines[0].amount)
    expect(five.subtotal).toBe(five.unitTotal * 5)
  })
})

describe('calculatePrice, errores', () => {
  it('materialId inexistente lanza y nombra el id', () => {
    expect(() => calculateSignPrice(northline, selection({ materialId: 'madera' }))).toThrow('madera')
  })

  it('lightingId inexistente lanza y nombra el id', () => {
    expect(() => calculateSignPrice(northline, selection({ lightingId: 'neon' }))).toThrow('neon')
  })

  it('type inexistente lanza y nombra el id', () => {
    expect(() => calculateSignPrice(northline, selection({ type: 'banner' }))).toThrow('banner')
  })

  it('quantity 0 lanza y nombra el valor', () => {
    expect(() => calculateSignPrice(northline, selection({ quantity: 0 }))).toThrow(/quantity.*0/)
  })

  it('width 0 lanza y nombra el valor', () => {
    expect(() => calculateSignPrice(northline, selection({ width: 0 }))).toThrow(/width.*0/)
  })
})

describe('calculatePrice, pureza', () => {
  it('dos llamadas con el mismo input dan resultados iguales', () => {
    const input = selection({ quantity: 3 })
    expect(calculateSignPrice(northline, input)).toEqual(calculateSignPrice(northline, input))
  })

  it('no muta selection ni rules', () => {
    const input = selection({ quantity: 3 })
    const inputBefore = structuredClone(input)
    const rulesBefore = structuredClone(northline)
    calculateSignPrice(northline, input)
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
    const result = calculateSignPrice(northline, completa)
    const porId = new Map(result.lines.map((line) => [line.id, line.detailValues]))
    expect(porId.get('material')).toEqual({ id: 'material', mode: 'area', area: 24, unitPrice: 15 })
    expect(porId.get('lighting')).toEqual({ id: 'lighting', mode: 'area', area: 24, unitPrice: 80 })
    expect(porId.get('type')).toEqual({ id: 'type', fixed: 400 })
    expect(porId.get('installation')).toEqual({
      id: 'installation',
      mode: 'area',
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
      const result = calculateSignPrice(rules, completa)
      expect(result.lines).toHaveLength(5)
      for (const line of result.lines) {
        expect(line.detailValues, `${slug}: linea ${line.id}`).toBeDefined()
        // detailValues es unknown en el PriceLine del core (SPEC 6.3): se lee su id.
        expect((line.detailValues as { id: string } | undefined)?.id).toBe(line.id)
      }
    }
  })

  // 9.2
  it('el area de detailValues es la misma que result.area, sin redondear', () => {
    const result = calculateSignPrice(norte, selection({ width: 1.75, height: 0.9 }))
    const material = result.lines.find((line) => line.id === 'material')?.detailValues
    expect(material).toEqual({ id: 'material', mode: 'area', area: result.area, unitPrice: 109000 })
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
    const conUsd = calculateSignPrice(northline, selection())
    const conEur = calculateSignPrice(otraMoneda, selection())
    expect(conEur.lines[0].detailValues).toEqual(conUsd.lines[0].detailValues)
  })
})

// Modo letters (SPEC 5.3, 5.4, 5.5 y 6). Numeros exactos, calculados a mano.
describe('calculatePrice en modo letters', () => {
  function letters(overrides: Partial<SignSelection> = {}): SignSelection {
    return selection({ type: 'letters', letterHeight: 1, depthId: 'd2', ...overrides })
  }

  it('northline: NORTHLINE, 9 letras de 1 ft, pvc, front, instalacion si, qty 1', () => {
    const result = calculateSignPrice(northline, letters())
    // 9 x 1 x 40 x 1 = 360; 9 x 70 = 630; 350 + 9 x 45 = 755.
    expect(result.letters).toBe(9)
    expect(result.letterHeight).toBe(1)
    expect(result.area).toBe(0)
    expect(result.unitTotal).toBe(1745)
    expect([result.total, result.min, result.max]).toEqual([1745, 1605, 1885])
    expect(result.lines.map((line) => [line.id, line.detail, line.amount])).toEqual([
      ['material', '9 x 1 x 40 x 1', 360],
      ['lighting', '9 x 70', 630],
      ['installation', '350 + 9 x 45', 755],
    ])
  })

  it('northline: MY SHOP cuenta 6 letras, acrylic 2.5 ft, 4 in, back, sin instalacion, qty 5 con 10%', () => {
    const result = calculateSignPrice(
      northline,
      letters({
        text: 'MY SHOP',
        letterHeight: 2.5,
        depthId: 'd4',
        materialId: 'acrylic',
        lightingId: 'back',
        installation: false,
        quantity: 5,
      }),
    )
    // 6 x 2.5 x 95 x 1.2 = 1710; 6 x 120 = 720; unidad 2430; x5 = 12150; -10% = 10935.
    expect(result.letters).toBe(6)
    expect(result.unitTotal).toBe(2430)
    expect(result.subtotal).toBe(12150)
    expect([result.total, result.min, result.max]).toEqual([10935, 10060, 11810])
    expect(result.lines.map((line) => line.id)).toEqual(['material', 'lighting', 'discount'])
  })

  it('norte: NORTE, 5 letras de 0,30 m, pvc espumado, frontal, instalacion si', () => {
    const result = calculateSignPrice(norte, letters({ text: 'NORTE', letterHeight: 0.3, depthId: 'd5' }))
    // 5 x 0,3 x 89000 = 133500; 5 x 47000 = 235000; 236000 + 5 x 30000 = 386000.
    expect(result.unitTotal).toBe(754500)
    expect([result.total, result.min, result.max]).toEqual([754500, 694140, 814860])
  })

  it('norte: CAFÉ 24 cuenta 6 letras con la tilde, chapa 0,45 m, 15 cm, retro, qty 2 con 5%', () => {
    const result = calculateSignPrice(
      norte,
      letters({
        text: 'CAFÉ 24',
        letterHeight: 0.45,
        depthId: 'd15',
        materialId: 'aluminum',
        lightingId: 'back',
        quantity: 2,
      }),
    )
    // 6 x 0,45 x 155000 x 1,4 = 585900; 6 x 81000 = 486000; 236000 + 6 x 30000 = 416000.
    expect(result.letters).toBe(6)
    expect(result.unitTotal).toBe(1487900)
    expect([result.total, result.min, result.max]).toEqual([2827010, 2600849, 3053171])
  })

  it('detailValues del modo letters traen los numeros crudos por modo', () => {
    const result = calculateSignPrice(northline, letters({ depthId: 'd6', lightingId: 'back' }))
    const porId = new Map(result.lines.map((line) => [line.id, line.detailValues]))
    expect(porId.get('material')).toEqual({
      id: 'material',
      mode: 'letters',
      letters: 9,
      letterHeight: 1,
      unitPrice: 40,
      depthFactor: 1.4,
    })
    expect(porId.get('lighting')).toEqual({ id: 'lighting', mode: 'letters', letters: 9, unitPrice: 120 })
    expect(porId.get('installation')).toEqual({
      id: 'installation',
      mode: 'letters',
      fixed: 350,
      perLetter: 45,
      letters: 9,
    })
  })

  it('ignora ancho y alto: el mismo precio con cualquier width y height', () => {
    const base = calculateSignPrice(northline, letters())
    expect(calculateSignPrice(northline, letters({ width: 20, height: 8 })).total).toBe(base.total)
  })

  it('lanza si el tipo no tiene pricing', () => {
    const rules = {
      ...northline,
      types: northline.types.map((item) => (item.id === 'letters' ? { id: 'letters', label: 'x', priceFixed: 0 } : item)),
    } as PriceRules
    expect(() => calculateSignPrice(rules, letters())).toThrow(/letters/)
    expect(() => calculateSignPrice(rules, letters())).toThrow(/pricing/)
  })

  it('lanza si el material no tiene pricePerLetterHeight, con el id en el mensaje', () => {
    const rules: PriceRules = {
      ...northline,
      materials: northline.materials.map((item) => ({ id: item.id, label: item.label, pricePerArea: item.pricePerArea })),
    }
    expect(() => calculateSignPrice(rules, letters({ materialId: 'aluminum' }))).toThrow(/"aluminum".*pricePerLetterHeight/)
  })

  it('lanza si la iluminacion no tiene pricePerLetter', () => {
    const rules: PriceRules = {
      ...northline,
      lighting: northline.lighting.map((item) => ({ id: item.id, label: item.label, pricePerArea: item.pricePerArea })),
    }
    expect(() => calculateSignPrice(rules, letters())).toThrow(/"front".*pricePerLetter/)
  })

  it('lanza si el depthId no existe, con el id en el mensaje', () => {
    expect(() => calculateSignPrice(northline, letters({ depthId: 'd99' }))).toThrow(/profundidad invalido: "d99"/)
  })

  it('lanza con texto vacio o solo espacios', () => {
    expect(() => calculateSignPrice(northline, letters({ text: '' }))).toThrow(/tiene 0/)
    expect(() => calculateSignPrice(northline, letters({ text: '   ' }))).toThrow(/tiene 0/)
  })

  it('lanza con mas de 18 letras y acepta 18 exactas', () => {
    expect(() => calculateSignPrice(northline, letters({ text: 'ABCDEFGHIJKLMNOPQRS' }))).toThrow(/tiene 19/)
    expect(calculateSignPrice(northline, letters({ text: 'ABCDEFGHIJKLMNOPQR' })).letters).toBe(18)
  })

  it('lanza si letterHeight no es mayor a 0', () => {
    expect(() => calculateSignPrice(northline, letters({ letterHeight: 0 }))).toThrow(/letterHeight/)
  })
})

describe('countLetters', () => {
  it('no cuenta espacios y cuenta una letra con tilde como una', () => {
    expect(countLetters('NORTE')).toBe(5)
    expect(countLetters(' MI  CAFÉ ')).toBe(6)
    expect(countLetters('')).toBe(0)
  })
})
