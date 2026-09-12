import { describe, expect, it } from 'vitest'
import type { CurrencyConfig } from '../types'
import { formatArea, formatCurrency, formatLength, formatLineDetail } from './format'

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

// Intl en es-AR separa el simbolo de moneda del numero con un espacio duro, no uno comun.
const NBSP = '\u00A0'

describe('formatArea', () => {
  // 9.4
  it('lleva la unidad y el separador decimal del locale', () => {
    expect(formatArea(24, 'en', 'sq ft')).toBe('24 sq ft')
    expect(formatArea(2.5, 'es-AR', 'm²')).toBe('2,5 m²')
  })
})

describe('formatLineDetail', () => {
  // 9.5
  it('material y lighting: area con unidad por el precio unitario', () => {
    expect(formatLineDetail({ id: 'material', area: 24, unitPrice: 15 }, usd, 'en', 'sq ft')).toBe(
      '24 sq ft x $15',
    )
    expect(
      formatLineDetail({ id: 'lighting', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²'),
    ).toBe(`2,5 m² x $${NBSP}109.000`)
  })

  // 9.6
  it('type, installation y discount, en los dos locales', () => {
    expect(formatLineDetail({ id: 'type', fixed: 400 }, usd, 'en', 'sq ft')).toBe('$400')
    expect(formatLineDetail({ id: 'type', fixed: 270000 }, ars, 'es-AR', 'm²')).toBe(
      `$${NBSP}270.000`,
    )
    expect(
      formatLineDetail({ id: 'installation', fixed: 350, perArea: 10, area: 24 }, usd, 'en', 'sq ft'),
    ).toBe('$350 + 24 sq ft x $10')
    expect(
      formatLineDetail(
        { id: 'installation', fixed: 236000, perArea: 73000, area: 2.5 },
        ars,
        'es-AR',
        'm²',
      ),
    ).toBe(`$${NBSP}236.000 + 2,5 m² x $${NBSP}73.000`)
    expect(formatLineDetail({ id: 'discount', pct: 5 }, usd, 'en', 'sq ft')).toBe('5%')
    expect(formatLineDetail({ id: 'discount', pct: 10 }, ars, 'es-AR', 'm²')).toBe('10%')
  })

  // 9.6
  it('no deja ningun numero crudo: el area y la moneda siempre van formateadas', () => {
    const enEs = formatLineDetail({ id: 'material', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²')
    expect(enEs).not.toContain('2.5')
    expect(enEs).not.toContain('109000')
  })
})
