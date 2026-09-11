import { describe, expect, it } from 'vitest'
import type { PriceResult } from '../types'
import { buildLeadRow } from './leadRow'

const RESULT: PriceResult = {
  area: 24,
  unitTotal: 360,
  subtotal: 360,
  discountPct: 0,
  total: 360,
  min: 331,
  max: 389,
  lines: [],
}

describe('buildLeadRow', () => {
  // 11.5
  it('canal form: las nueve columnas de SPEC 9 con los valores esperados', () => {
    const row = buildLeadRow({
      clientSlug: 'northline',
      channel: 'form',
      selection: { type: 'facade' },
      result: RESULT,
      contact: { name: 'Ana', value: 'ana@test.example', note: 'urgente' },
    })
    expect(row).toEqual({
      client_slug: 'northline',
      channel: 'form',
      selection: { type: 'facade' },
      price_total: 360,
      price_min: 331,
      price_max: 389,
      contact_name: 'Ana',
      contact_value: 'ana@test.example',
      note: 'urgente',
    })
  })

  // 11.6
  it('canal whatsapp sin contacto: los tres campos en null y ninguna columna de mas', () => {
    const row = buildLeadRow({
      clientSlug: 'norte',
      channel: 'whatsapp',
      selection: {},
      result: RESULT,
    })
    expect(row.contact_name).toBeNull()
    expect(row.contact_value).toBeNull()
    expect(row.note).toBeNull()
    expect(Object.keys(row).sort()).toEqual([
      'channel',
      'client_slug',
      'contact_name',
      'contact_value',
      'note',
      'price_max',
      'price_min',
      'price_total',
      'selection',
    ])
  })

  // 11.7
  it('recorta con trim y corta a 500 los tres campos de texto', () => {
    const row = buildLeadRow({
      clientSlug: 'northline',
      channel: 'form',
      selection: {},
      result: RESULT,
      contact: { name: '  Ana  ', value: '  ana@test.example  ', note: `  ${'x'.repeat(600)}  ` },
    })
    expect(row.contact_name).toBe('Ana')
    expect(row.contact_value).toBe('ana@test.example')
    expect(String(row.note)).toHaveLength(500)
  })
})
