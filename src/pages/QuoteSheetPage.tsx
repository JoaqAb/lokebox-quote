import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { priceRulesFromClient } from '../core/clientConfig'
import { calculatePrice } from '../core/pricing/calculatePrice'
import { decodeQuoteParams } from '../core/quote/quoteParams'
import { formatQuoteDate } from '../core/quote/quoteDate'
import { themeFromClient } from '../core/theme'
import { QuoteSheet } from '../core/ui/QuoteSheet'
import { useHtmlLang } from '../core/ui/useHtmlLang'
import type { ClientConfig, PriceResult, SignSelection } from '../core/types'
import { signQuoteRows } from '../verticals/signs/quoteRows'
import { areaUnitSymbol } from '../verticals/signs/visuals'
import { ErrorScreen } from './ErrorScreen'
import { resolveClient } from './resolveClient'

// La hoja de cotizacion. El nombre es distinto de QuotePage a proposito: QuotePage es el
// cotizador, esta es la hoja. La seleccion viaja en la query y no se recalcula con los
// defaults del cliente: si algo no valida, ErrorScreen.
// No llama a useVisitOnce ni a insertRow: la hoja no escribe nada, ni lead ni visita.
// No monta el canvas: aca no se importa nada de three.

type QuoteSheetScreenProps = {
  config: ClientConfig
  params: URLSearchParams
}

type Priced = { selection: SignSelection; price: PriceResult } | null

function priceFrom(config: ClientConfig, params: URLSearchParams): Priced {
  const selection = decodeQuoteParams(config.options, params)
  if (selection === null) {
    return null
  }
  try {
    return { selection, price: calculatePrice(priceRulesFromClient(config), selection) }
  } catch {
    return null
  }
}

function QuoteSheetScreen({ config, params }: QuoteSheetScreenProps) {
  useHtmlLang(config.locale)
  const theme = useMemo(() => themeFromClient(config), [config])
  // Una sola lectura del reloj, al montar: reimprimir no cambia la fecha de la hoja.
  const today = useMemo(() => new Date(), [])

  const priced = priceFrom(config, params)
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
        rows={signQuoteRows(config, priced.selection)}
        price={priced.price}
        date={formatQuoteDate(today, config.locale)}
        poweredBy={config.poweredBy}
        backHref={`/d/${config.slug}`}
        areaUnit={areaUnitSymbol(config.units.area)}
        lengthUnit={config.units.length}
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
  return <QuoteSheetScreen key={slug} config={resolved.config} params={searchParams} />
}
