import { DISCOUNT_LINE_ID } from '../pricing/composePrice'
import { formatCurrency, formatPercent } from '../pricing/format'
import { resolveTextKey } from '../textKeys'
import type { ClientTexts, CurrencyConfig, PriceLine, PriceResult } from '../types'

// Desglose del precio. Los importes son por unidad (DECISIONES 11/09/2026).
// El descuento llega negativo desde composePrice y se muestra tal cual.
// El detalle de cada linea no es el string tecnico del calculo (line.detail), que no se muestra
// nunca. Desde la version 2.13 (D133) el detalle de las lineas de la vertical y la linea de encima
// del desglose los arma la vertical (lineDetail y breakdownCaption de SPEC 4.4); el core formatea
// solo el porcentaje del descuento.

type PriceBreakdownProps = {
  result: PriceResult
  texts: ClientTexts
  currency: CurrencyConfig
  locale: string
  caption: string | null
  lineDetail: (line: PriceLine) => string | null
}

export function PriceBreakdown({ result, texts, currency, locale, caption, lineDetail }: PriceBreakdownProps) {
  return (
    <section className="mt-8">
      {caption === null ? null : (
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">{caption}</p>
      )}
      <ul className="mt-2">
        {result.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-3 q-hairline border-t py-2"
          >
            <span className="min-w-0 text-sm">{resolveTextKey(line.labelKey, texts)}</span>
            <span className="ml-auto shrink-0 text-xs text-[var(--q-muted)] tabular-nums">
              {line.id === DISCOUNT_LINE_ID ? formatPercent(result.discountPct, locale) : lineDetail(line)}
            </span>
            <span className="w-28 shrink-0 text-right text-sm font-medium tabular-nums">
              {formatCurrency(line.amount, currency, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
