import { describe, expect, it } from 'vitest'
import type { PriceLine, PriceResult } from '../types'
import { buildLeadRow } from './leadRow'

// Dos lineas de verdad y no una lista vacia: la columna lines existe para guardar esto.
const LINES: PriceLine[] = [
  {
    id: 'material',
    labelKey: 'lineMaterial',
    detail: '24 x 15',
    amount: 360,
    detailValues: { id: 'material', mode: 'area', area: 24, unitPrice: 15 },
  },
  { id: 'type', labelKey: 'lineType', detail: '0', amount: 0, detailValues: { id: 'type', fixed: 0 } },
]

const RESULT: PriceResult = {
  area: 24,
  unitTotal: 360,
  subtotal: 360,
  discountPct: 0,
  total: 360,
  min: 331,
  max: 389,
  lines: LINES,
}

describe('buildLeadRow', () => {
  // 11.5
  it('canal form: las diez columnas de SPEC 9 con los valores esperados', () => {
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
      lines: LINES,
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
      'lines',
      'note',
      'price_max',
      'price_min',
      'price_total',
      'selection',
    ])
  })

  // El lead guarda siempre el desglose, se muestre o no el precio (SPEC 6.2): el modo de
  // visibilidad no llega a esta funcion, y por eso los dos canales escriben lo mismo.
  it('los dos canales escriben el desglose del motor en lines, sin tocarlo', () => {
    for (const channel of ['form', 'whatsapp'] as const) {
      const row = buildLeadRow({
        clientSlug: 'northline',
        channel,
        selection: {},
        result: RESULT,
        contact: channel === 'form' ? { name: 'Ana', value: 'a@test.example', note: '' } : undefined,
      })
      expect(row.lines).toEqual(LINES)
      expect(row.price_total).toBe(360)
    }
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
