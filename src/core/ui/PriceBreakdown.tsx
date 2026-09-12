import { resolveLineLabel } from '../pricing/lineLabels'
import { formatArea, formatCurrency, formatLineDetail } from '../pricing/format'
import type { ClientConfig, PriceResult } from '../types'

// Desglose del precio. Los importes son por unidad (DECISIONES 11/09/2026).
// El descuento llega negativo desde el motor y se muestra tal cual.
// El detalle de cada linea se formatea aca con detailValues: el string tecnico del motor
// (line.detail) no se muestra nunca. El simbolo de la unidad lo pone la vertical.

type PriceBreakdownProps = {
  result: PriceResult
  config: ClientConfig
  areaUnit: string
}

export function PriceBreakdown({ result, config, areaUnit }: PriceBreakdownProps) {
  const { texts, currency, locale } = config
  return (
    <section className="mt-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
        {formatArea(result.area, locale, areaUnit)}
      </p>
      <ul className="mt-2">
        {result.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-3 border-t border-white/5 py-2"
          >
            <span className="min-w-0 text-sm">{resolveLineLabel(line.labelKey, texts)}</span>
            <span className="ml-auto shrink-0 text-xs text-[var(--q-muted)] tabular-nums">
              {line.detailValues === undefined
                ? null
                : formatLineDetail(line.detailValues, currency, locale, areaUnit)}
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
