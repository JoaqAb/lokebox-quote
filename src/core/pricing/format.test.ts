import { describe, expect, it } from 'vitest'
import type { CurrencyConfig } from '../types'
import { formatArea, formatCurrency, formatLength, formatPercent } from './format'

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
