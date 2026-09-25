import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { priceDisplayOf } from '../core/clientConfig'
import { formatQuoteDate } from '../core/quote/quoteDate'
import { themeFromClient } from '../core/theme'
import { QuoteSheet } from '../core/ui/QuoteSheet'
import { useHtmlLang } from '../core/ui/useHtmlLang'
import type { PriceResult } from '../core/types'
import { ErrorScreen } from './ErrorScreen'
import { resolveClient, type ResolvedClient } from './resolveClient'

// La hoja de cotizacion: la pagina /d/<slug>/quote, la misma para toda vertical (SPEC 4.4 y 8).
// El nombre es distinto de QuotePage a proposito: QuotePage es el cotizador, esta es la hoja. La
// seleccion viaja en la query con las claves de la vertical y no se completa con los defaults del
// cliente: si algo no valida, ErrorScreen.
// No llama a useVisitOnce ni a insertRow: la hoja no escribe nada, ni lead ni visita.
// No monta la vista de la vertical: aca no se descarga three.

type QuoteSheetScreenProps = ResolvedClient & {
  params: URLSearchParams
}

type Priced = { selection: unknown; price: PriceResult } | null

function priceFrom({ vertical, verticalConfig }: ResolvedClient, params: URLSearchParams): Priced {
  const selection = vertical.logic.decodeQuery(verticalConfig, params)
  if (selection === null) {
    return null
  }
  try {
    return { selection, price: vertical.logic.price(verticalConfig, selection) }
  } catch {
    return null
  }
}

function QuoteSheetScreen({ params, config, vertical, verticalConfig }: QuoteSheetScreenProps) {
  useHtmlLang(config.locale)
  const theme = useMemo(() => themeFromClient(config), [config])
  // Una sola lectura del reloj, al montar: reimprimir no cambia la fecha de la hoja.
  const today = useMemo(() => new Date(), [])

  const priced = priceFrom({ config, vertical, verticalConfig }, params)
  if (priced === null) {
    return <ErrorScreen detail={`/d/${config.slug}/quote`} />
  }

  return (
    <div
      style={theme}
      className="min-h-dvh bg-[var(--q-bg)] text-[var(--q-text)] print:bg-white print:text-black"
    >
      <QuoteSheet
        brand={config.brand}
        texts={config.texts}
        locale={config.locale}
        currency={config.currency}
        rows={vertical.logic.sheetRows(verticalConfig, priced.selection)}
        price={priced.price}
        date={formatQuoteDate(today, config.locale)}
        poweredBy={config.poweredBy}
        backHref={`/d/${config.slug}`}
        lineDetail={(line) => vertical.logic.lineDetail(verticalConfig, line)}
        caption={vertical.logic.breakdownCaption(verticalConfig, priced.price)}
        display={priceDisplayOf(config)}
      />
    </div>
  )
}

export function QuoteSheetPage() {
  const routeParams = useParams()
  const [searchParams] = useSearchParams()
  const slug = routeParams.slug ?? ''
  const resolved = resolveClient(slug)
  if (!resolved.ok) {
    return <ErrorScreen detail={resolved.detail} />
  }
  return (
    <QuoteSheetScreen
      key={slug}
      config={resolved.config}
      vertical={resolved.vertical}
      verticalConfig={resolved.verticalConfig}
      params={searchParams}
    />
  )
}
