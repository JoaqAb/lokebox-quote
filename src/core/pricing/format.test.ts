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
    expect(formatLineDetail({ id: 'material', mode: 'area', area: 24, unitPrice: 15 }, usd, 'en', 'sq ft', 'ft')).toBe(
      '24 sq ft x $15',
    )
    expect(
      formatLineDetail({ id: 'lighting', mode: 'area', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²', 'm'),
    ).toBe(`2,5 m² x $${NBSP}109.000`)
  })

  // 9.6
  it('type, installation y discount, en los dos locales', () => {
    expect(formatLineDetail({ id: 'type', fixed: 400 }, usd, 'en', 'sq ft', 'ft')).toBe('$400')
    expect(formatLineDetail({ id: 'type', fixed: 270000 }, ars, 'es-AR', 'm²', 'm')).toBe(
      `$${NBSP}270.000`,
    )
    expect(
      formatLineDetail({ id: 'installation', mode: 'area', fixed: 350, perArea: 10, area: 24 }, usd, 'en', 'sq ft', 'ft'),
    ).toBe('$350 + 24 sq ft x $10')
    expect(
      formatLineDetail(
        { id: 'installation', mode: 'area', fixed: 236000, perArea: 73000, area: 2.5 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`$${NBSP}236.000 + 2,5 m² x $${NBSP}73.000`)
    expect(formatLineDetail({ id: 'discount', pct: 5 }, usd, 'en', 'sq ft', 'ft')).toBe('5%')
    expect(formatLineDetail({ id: 'discount', pct: 10 }, ars, 'es-AR', 'm²', 'm')).toBe('10%')
  })

  // 9.6
  it('no deja ningun numero crudo: el area y la moneda siempre van formateadas', () => {
    const enEs = formatLineDetail({ id: 'material', mode: 'area', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²', 'm')
    expect(enEs).not.toContain('2.5')
    expect(enEs).not.toContain('109000')
  })
})

describe('formatLineDetail en modo letters', () => {
  it('letras, alto con unidad, precio y factor, en el locale de cada cliente', () => {
    expect(
      formatLineDetail(
        { id: 'material', mode: 'letters', letters: 9, letterHeight: 1.25, unitPrice: 40, depthFactor: 1.2 },
        usd,
        'en',
        'sq ft',
        'ft',
      ),
    ).toBe('9 x 1.25 ft x $40 x 1.2')
    expect(
      formatLineDetail(
        { id: 'material', mode: 'letters', letters: 5, letterHeight: 0.3, unitPrice: 89000, depthFactor: 1.4 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`5 x 0,3 m x $${NBSP}89.000 x 1,4`)
  })

  it('iluminacion e instalacion por letra, sin area', () => {
    expect(formatLineDetail({ id: 'lighting', mode: 'letters', letters: 9, unitPrice: 70 }, usd, 'en', 'sq ft', 'ft')).toBe(
      '9 x $70',
    )
    expect(
      formatLineDetail(
        { id: 'installation', mode: 'letters', fixed: 236000, perLetter: 30000, letters: 5 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`$${NBSP}236.000 + 5 x $${NBSP}30.000`)
  })
})
