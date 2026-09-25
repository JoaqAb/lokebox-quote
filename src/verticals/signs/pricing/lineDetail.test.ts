import { describe, expect, it } from 'vitest'
import type { CurrencyConfig } from '../../../core/types'
import { formatSignLineDetail } from './lineDetail'

// Hasta la version 2.12 estos tests eran de formatLineDetail en src/core/pricing/format.test.ts.

const usd: CurrencyConfig = { code: 'USD', symbol: '$', decimals: 0 }
const ars: CurrencyConfig = { code: 'ARS', symbol: '$', decimals: 0 }
// Intl en es-AR separa el simbolo de moneda del numero con un espacio duro, no uno comun.
const NBSP = '\u00A0'

describe('formatSignLineDetail', () => {
  // 9.5
  it('material y lighting: area con unidad por el precio unitario', () => {
    expect(formatSignLineDetail({ id: 'material', mode: 'area', area: 24, unitPrice: 15 }, usd, 'en', 'sq ft', 'ft')).toBe(
      '24 sq ft x $15',
    )
    expect(
      formatSignLineDetail({ id: 'lighting', mode: 'area', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²', 'm'),
    ).toBe(`2,5 m² x $${NBSP}109.000`)
  })

  // 9.6
  it('type e installation, en los dos locales (el descuento lo formatea el core: formatPercent)', () => {
    expect(formatSignLineDetail({ id: 'type', fixed: 400 }, usd, 'en', 'sq ft', 'ft')).toBe('$400')
    expect(formatSignLineDetail({ id: 'type', fixed: 270000 }, ars, 'es-AR', 'm²', 'm')).toBe(
      `$${NBSP}270.000`,
    )
    expect(
      formatSignLineDetail({ id: 'installation', mode: 'area', fixed: 350, perArea: 10, area: 24 }, usd, 'en', 'sq ft', 'ft'),
    ).toBe('$350 + 24 sq ft x $10')
    expect(
      formatSignLineDetail(
        { id: 'installation', mode: 'area', fixed: 236000, perArea: 73000, area: 2.5 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`$${NBSP}236.000 + 2,5 m² x $${NBSP}73.000`)
  })

  // 9.6
  it('no deja ningun numero crudo: el area y la moneda siempre van formateadas', () => {
    const enEs = formatSignLineDetail({ id: 'material', mode: 'area', area: 2.5, unitPrice: 109000 }, ars, 'es-AR', 'm²', 'm')
    expect(enEs).not.toContain('2.5')
    expect(enEs).not.toContain('109000')
  })
})

describe('formatSignLineDetail en modo letters', () => {
  it('letras, alto con unidad, precio y factor, en el locale de cada cliente', () => {
    expect(
      formatSignLineDetail(
        { id: 'material', mode: 'letters', letters: 9, letterHeight: 1.25, unitPrice: 40, depthFactor: 1.2 },
        usd,
        'en',
        'sq ft',
        'ft',
      ),
    ).toBe('9 x 1.25 ft x $40 x 1.2')
    expect(
      formatSignLineDetail(
        { id: 'material', mode: 'letters', letters: 5, letterHeight: 0.3, unitPrice: 89000, depthFactor: 1.4 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`5 x 0,3 m x $${NBSP}89.000 x 1,4`)
  })

  it('iluminacion e instalacion por letra, sin area', () => {
    expect(formatSignLineDetail({ id: 'lighting', mode: 'letters', letters: 9, unitPrice: 70 }, usd, 'en', 'sq ft', 'ft')).toBe(
      '9 x $70',
    )
    expect(
      formatSignLineDetail(
        { id: 'installation', mode: 'letters', fixed: 236000, perLetter: 30000, letters: 5 },
        ars,
        'es-AR',
        'm²',
        'm',
      ),
    ).toBe(`$${NBSP}236.000 + 5 x $${NBSP}30.000`)
  })
})
