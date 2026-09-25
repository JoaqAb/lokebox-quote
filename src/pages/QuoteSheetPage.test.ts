import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { getClient } from '../clients'
import { priceDisplayOf } from '../core/clientConfig'
import { QuoteSheet } from '../core/ui/QuoteSheet'
import { QuoteSheetPage } from './QuoteSheetPage'
import { resolveClient } from './resolveClient'

// La leyenda del desglose en la hoja (D158, SPEC 8 desde 2.17): con precio va encima del desglose
// en toda vertical, y sin precio no va. Se renderiza la pagina real con la query de la hoja.

function renderSheet(path: string): string {
  const route = createElement(Route, { path: '/d/:slug/quote', element: createElement(QuoteSheetPage) })
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Routes, null, route)))
}

function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ')
}

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('hoja: leyenda del desglose', () => {
  it('carteles en modo area: la linea de area va encima del desglose', () => {
    const northline = clientOrFail('northline')
    const html = renderSheet('/d/northline/quote?t=facade&x=NORTHLINE&w=8&h=3&m=pvc&l=front&i=0&q=1')
    // El detalle de las lineas tambien lleva el area: la leyenda es su propio parrafo, entre el
    // titulo del desglose y la primera linea.
    const title = html.indexOf(northline.texts.quoteBreakdownTitle)
    const caption = html.indexOf('>24 sq ft</p>')
    expect(title).toBeGreaterThan(-1)
    expect(caption).toBeGreaterThan(title)
    expect(caption).toBeLessThan(html.indexOf('<li class'))
  })

  it('carteles en modo letters: la vertical devuelve null y no hay linea', () => {
    const html = renderSheet('/d/northline/quote?t=letters&x=NORTHLINE&lh=0.5&d=d2&m=pvc&l=front&i=0&q=1')
    const title = html.indexOf('</h2>', html.indexOf(clientOrFail('northline').texts.quoteBreakdownTitle))
    expect(html.slice(title, html.indexOf('<li class')).includes('<p')).toBe(false)
  })

  it('cajas: la leyenda por caja y por pedido, con la cantidad formateada', () => {
    const text = textOf(renderSheet('/d/foldline/quote?s=two-piece&l=10&w=8&h=4&m=rigid&p=full&q=500'))
    expect(text).toContain('Prices per box for 500 boxes. Print setup is per order.')
    const cajasur = textOf(renderSheet('/d/cajasur/quote?s=mailer&l=30&w=20&h=15&m=blanco&p=full-interior&q=1000'))
    expect(cajasur).toContain('Precios por caja para 1.000 cajas. La preparación de impresión es por pedido.')
  })

  it('sin precio (alba, hidden): no hay desglose ni leyenda', () => {
    const alba = clientOrFail('alba')
    expect(priceDisplayOf(alba)).toBe('hidden')
    const text = textOf(renderSheet('/d/alba/quote?t=facade&x=ALBA&w=0.6&h=0.3&m=pvc&l=front&i=0&q=1'))
    expect(text).not.toContain(alba.texts.quoteBreakdownTitle)
    expect(text).not.toContain('m²')
  })

  it('sin precio, la plantilla no muestra la leyenda aunque la vertical la devuelva (cajas)', () => {
    const resolved = resolveClient('foldline')
    if (!resolved.ok) {
      throw new Error(resolved.detail)
    }
    const { config, vertical, verticalConfig } = resolved
    const selection = vertical.logic.decodeQuery(verticalConfig, new URLSearchParams('s=two-piece&l=10&w=8&h=4&m=rigid&p=full&q=500'))
    const price = vertical.logic.price(verticalConfig, selection)
    const caption = vertical.logic.breakdownCaption(verticalConfig, price)
    expect(caption).not.toBeNull()
    const props = {
      brand: config.brand,
      texts: config.texts,
      locale: config.locale,
      currency: config.currency,
      rows: vertical.logic.sheetRows(verticalConfig, selection),
      price,
      date: '25/09/2026',
      poweredBy: false,
      backHref: '/d/foldline',
      lineDetail: () => null,
      caption,
    }
    expect(textOf(renderToStaticMarkup(createElement(QuoteSheet, { ...props, display: 'exact' })))).toContain(String(caption))
    expect(textOf(renderToStaticMarkup(createElement(QuoteSheet, { ...props, display: 'hidden' })))).not.toContain(String(caption))
  })
})
