import { describe, expect, it } from 'vitest'
import type { CurrencyConfig } from '../types'
import { formatCurrency, formatLength } from './format'

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
