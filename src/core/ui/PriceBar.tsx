import { formatCurrency } from '../pricing/format'
import type { ClientConfig, PriceResult } from '../types'
import { AnimatedAmount } from './AnimatedAmount'

// Bloque de precio. Siempre visible: en mobile fijo al pie de la ventana,
// en desktop al pie de la columna del panel. El disclaimer va siempre, sin acordeon.
// Borde superior y sombra corta hacia arriba (D24, .q-price-edge): sin la sombra el
// control que queda debajo del bloque se lee cortado y no como contenido que sigue.

type PriceBarProps = {
  result: PriceResult
  config: ClientConfig
}

export function PriceBar({ result, config }: PriceBarProps) {
  const { texts, currency, locale } = config
  return (
    <div className="q-hairline q-panel q-price-edge border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
        {texts.priceLabel}
      </p>
      <p className="mt-1 text-3xl font-semibold sm:text-4xl">
        <AnimatedAmount value={result.total} currency={currency} locale={locale} />
      </p>
      <p className="mt-1 text-sm text-[var(--q-muted)]">
        {texts.priceRangeNote}: {formatCurrency(result.min, currency, locale)}
        {' / '}
        {formatCurrency(result.max, currency, locale)}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--q-muted)]">{texts.disclaimer}</p>
    </div>
  )
}
