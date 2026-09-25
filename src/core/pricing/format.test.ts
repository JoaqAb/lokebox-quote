import { describe, expect, it } from 'vitest'
import type { CurrencyConfig } from '../types'
import { areaUnitSymbol, formatArea, formatCurrency, formatInteger, formatLength, formatPercent } from './format'

const usd: CurrencyConfig = { code: 'USD', symbol: '$', decimals: 0 }
const ars: CurrencyConfig = { code: 'ARS', symbol: '$', decimals: 0 }

describe('formatCurrency', () => {
  it('el mismo numero da dos strings distintos segun locale y moneda', () => {
    const enUsd = formatCurrency(2390, usd, 'en')
    const esArs = formatCurrency(2390, ars, 'es-AR')
    expect(enUsd).not.toBe(esArs)
  })

  it('no muestra decimales cuando la moneda tiene decimals 0', () => {
    expect(formatCurrency(2390, usd, 'en')).not.toMatch(/[.,]\d\d$/)
    expect(formatCurrency(1781000, ars, 'es-AR')).not.toMatch(/[.,]\d\d$/)
  })

  it('respeta los decimales configurados', () => {
    const twoDecimals: CurrencyConfig = { code: 'USD', symbol: '$', decimals: 2 }
    expect(formatCurrency(2390.5, twoDecimals, 'en')).toMatch(/[.,]50$/)
  })

  it('sin display pone el simbolo, y con display code pone el codigo de la moneda', () => {
    const byCode: CurrencyConfig = { ...usd, display: 'code' }
    expect(formatCurrency(250, usd, 'en')).toBe('$250')
    // El separador que mete Intl entre el codigo y el numero es un espacio duro.
    expect(formatCurrency(250, byCode, 'en').replace(/\u00a0/g, ' ')).toBe('USD 250')
    expect(formatCurrency(29, byCode, 'en').replace(/\u00a0/g, ' ')).toBe('USD 29')
  })
})

describe('formatLength', () => {
  // 13.10
  it('usa el separador decimal del locale y no agrega decimales de mas', () => {
    expect(formatLength(8, 'en')).toBe('8')
    expect(formatLength(8.5, 'en')).toBe('8.5')
    expect(formatLength(2.5, 'es-AR')).toBe('2,5')
    expect(formatLength(1, 'es-AR')).toBe('1')
  })
})

describe('formatInteger', () => {
  // D159
  it('cero decimales con el separador de miles del locale', () => {
    expect(formatInteger(1000, 'en-US')).toBe('1,000')
    expect(formatInteger(1000, 'es-AR')).toBe('1.000')
    expect(formatInteger(1000, 'en-GB')).toBe('1,000')
    expect(formatInteger(25000, 'es-ES')).toBe('25.000')
    expect(formatInteger(500, 'en-US')).toBe('500')
    expect(formatInteger(0, 'es-AR')).toBe('0')
  })

  it('lanza con un valor no entero, con el valor en el mensaje: nunca redondea', () => {
    expect(() => formatInteger(2.5, 'en-US')).toThrow('2.5')
    expect(() => formatInteger(0.1, 'es-AR')).toThrow('0.1')
  })

  it('lanza con un valor no finito, con el valor en el mensaje', () => {
    expect(() => formatInteger(Number.NaN, 'en-US')).toThrow('NaN')
    expect(() => formatInteger(Number.POSITIVE_INFINITY, 'es-ES')).toThrow('Infinity')
  })
})

describe('formatArea', () => {
  // 9.4
  it('lleva la unidad y el separador decimal del locale', () => {
    expect(formatArea(24, 'en', 'sq ft')).toBe('24 sq ft')
    expect(formatArea(2.5, 'es-AR', 'm²')).toBe('2,5 m²')
  })
})

describe('formatPercent', () => {
  // 9.6, la parte del descuento: desde 2.13 es la unica linea que formatea el core. Movido de
  // formatLineDetail({ id: 'discount', pct }), con los mismos valores.
  it('el porcentaje del descuento, en los dos locales', () => {
    expect(formatPercent(5, 'en')).toBe('5%')
    expect(formatPercent(10, 'es-AR')).toBe('10%')
  })
})

// Movido de la vertical de carteles con el codigo en TAREA_033 (D143).
describe('areaUnitSymbol', () => {
  // 9.7
  it('mapea las unidades de area de los dos clientes', () => {
    expect(areaUnitSymbol('m2')).toBe('m²')
    expect(areaUnitSymbol('sqft')).toBe('sq ft')
  })

  // 9.7
  it('lanza con una unidad desconocida, con la unidad en el mensaje', () => {
    expect(() => areaUnitSymbol('acres')).toThrow(/acres/)
  })
})
