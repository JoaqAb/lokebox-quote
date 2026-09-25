import { describe, expect, it } from 'vitest'
import { getClient } from '../../../clients'
import { buildLeadRow } from '../../../core/lead/leadRow'
import { DISCOUNT_LINE_ID } from '../../../core/pricing/composePrice'
import { formatCurrency, formatPercent } from '../../../core/pricing/format'
import { resolveTextKey } from '../../../core/textKeys'
import { signsLogic } from '../logic'
import { signsConfigOf, signsClientSlugs } from '../testing'
import type { SignPriceResult, SignSelection } from '../types'

// La vara de D122 para el refactor de TAREA_032 (criterios 9 y 10): el fixture se genero con
// scripts/snapshot-precios.mjs sobre el codigo de 2.12 (commit de la fase 1, antes del refactor) y
// no se regenera. Si un caso da distinto, el refactor cambio un dato: se frena y se reporta.

type Case = { slug: string; selection: SignSelection; result: SignPriceResult; query: string }
type Published = Case & { origin: string }
type View = {
  slug: string
  selection: SignSelection
  caption: string | null
  breakdown: { label: string; detail: string; amount: string }[]
  sheetRows: { label: string; value: string }[]
  leadRow: Record<string, unknown>
  whatsapp: string | null
}

type Snapshot = { totals: Record<string, number>; cases: Case[]; published: Published[]; views: View[] }

// El fixture pesa 9 MB: se carga por Vite con import.meta.glob, sin que TypeScript infiera su tipo.
const snapshot = Object.values(import.meta.glob('./priceSnapshot.json', { eager: true, import: 'default' }))[0] as Snapshot
const cases = snapshot.cases
const published = snapshot.published
const views = snapshot.views

function clientTexts(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client.texts
}

describe('snapshot del calculo (D122)', () => {
  it('el fixture cubre los cinco clientes con el total de casos que declara', () => {
    expect(Object.keys(snapshot.totals).sort()).toEqual(signsClientSlugs())
    for (const slug of signsClientSlugs()) {
      expect(cases.filter((item) => item.slug === slug).length, slug).toBe(snapshot.totals[slug])
    }
    expect(cases.length).toBe(9360)
  })

  // Criterio 9: el resultado de la vertical contra el fixture, con toStrictEqual, en toda la matriz.
  it('price de la vertical da exactamente el resultado del fixture en toda la matriz', () => {
    for (const item of cases) {
      const result = signsLogic.price(signsConfigOf(item.slug), item.selection)
      expect(result, `${item.slug} ${item.query}`).toStrictEqual(item.result)
    }
  })

  // Criterio 10, sobre la matriz: encodeQuery reproduce la URL exacta y decodeQuery vuelve a la
  // misma seleccion y al mismo precio.
  it('encodeQuery reproduce cada URL y decodeQuery vuelve a la misma seleccion y al mismo precio', () => {
    for (const item of cases) {
      const config = signsConfigOf(item.slug)
      expect(signsLogic.encodeQuery(config, item.selection), item.query).toBe(item.query)
      const decoded = signsLogic.decodeQuery(config, new URLSearchParams(item.query))
      expect(decoded, item.query).toStrictEqual(item.selection)
      expect(signsLogic.price(config, decoded as SignSelection), item.query).toStrictEqual(item.result)
    }
  })
})

describe('URLs de hoja ya publicadas (D122)', () => {
  // Criterio 10: cada URL publicada decodifica a la misma seleccion y al mismo precio, y
  // encodeQuery de esa seleccion reproduce la URL exacta.
  it('siguen valiendo con las mismas claves', () => {
    expect(published.length).toBeGreaterThan(0)
    for (const item of published) {
      const config = signsConfigOf(item.slug)
      const decoded = signsLogic.decodeQuery(config, new URLSearchParams(item.query))
      expect(decoded, item.origin).toStrictEqual(item.selection)
      expect(signsLogic.price(config, item.selection), item.origin).toStrictEqual(item.result)
      expect(signsLogic.encodeQuery(config, item.selection), item.origin).toBe(item.query)
    }
  })

  it('la hoja de quote-northline.pdf sigue dando el precio impreso', () => {
    const pdf = published.find((item) => item.origin.startsWith('validacion/venta/quote-northline.pdf'))
    expect(pdf?.result.total).toBe(1330)
    expect(pdf?.result.min).toBe(1224)
    expect(pdf?.result.max).toBe(1436)
  })
})

describe('lo que ve el visitante y lo que se guarda (D122)', () => {
  it('desglose, linea de area, filas de la hoja, fila del lead y mensaje de WhatsApp no cambian', () => {
    expect(views.length).toBeGreaterThan(0)
    for (const view of views) {
      const config = signsConfigOf(view.slug)
      const texts = clientTexts(view.slug)
      const result = signsLogic.price(config, view.selection)
      const label = `${view.slug} ${JSON.stringify(view.selection)}`
      expect(signsLogic.breakdownCaption(config, result), label).toBe(view.caption)
      expect(
        result.lines.map((line) => ({
          label: resolveTextKey(line.labelKey, texts),
          detail: line.id === DISCOUNT_LINE_ID ? formatPercent(result.discountPct, config.locale) : signsLogic.lineDetail(config, line),
          amount: formatCurrency(line.amount, config.currency, config.locale),
        })),
        label,
      ).toStrictEqual(view.breakdown)
      expect(signsLogic.sheetRows(config, view.selection), label).toStrictEqual(view.sheetRows)
      expect(
        buildLeadRow({
          clientSlug: view.slug,
          channel: 'whatsapp',
          selection: signsLogic.leadSelection(config, view.selection),
          result,
        }),
        label,
      ).toStrictEqual(view.leadRow)
      const whatsapp = config.cta === 'form' ? null : signsLogic.whatsappMessage(config, view.selection, result, config.display)
      expect(whatsapp, label).toBe(view.whatsapp)
    }
  })
})
