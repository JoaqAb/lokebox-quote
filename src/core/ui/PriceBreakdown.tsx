import { resolveLineLabel } from '../pricing/lineLabels'
import { formatCurrency } from '../pricing/format'
import type { ClientConfig, PriceResult } from '../types'

// Desglose del precio. Los importes son por unidad (DECISIONES 11/09/2026).
// El descuento llega negativo desde el motor y se muestra tal cual.

type PriceBreakdownProps = {
  result: PriceResult
  config: ClientConfig
}

function roundArea(area: number): number {
  return Math.round(area * 100) / 100
}

export function PriceBreakdown({ result, config }: PriceBreakdownProps) {
  const { texts, currency, locale, units } = config
  return (
    <section className="mt-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
        {roundArea(result.area)} {units.area}
      </p>
      <ul className="mt-2">
        {result.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-3 border-t border-white/5 py-2"
          >
            <span className="min-w-0 text-sm">{resolveLineLabel(line.labelKey, texts)}</span>
            <span className="ml-auto shrink-0 text-xs text-[var(--q-muted)] tabular-nums">
              {line.detail}
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
