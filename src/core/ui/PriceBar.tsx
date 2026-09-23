import { formatCurrency } from '../pricing/format'
import type { ClientConfig, PriceDisplay, PriceResult } from '../types'
import { AnimatedAmount } from './AnimatedAmount'

// Bloque de precio. Siempre visible: en mobile fijo al pie de la ventana,
// en desktop al pie de la columna del panel. El disclaimer va siempre, sin acordeon.
// Desde la version 2.8 (D93) comparte el bloque de pie con el CTA: el borde, la superficie y la
// sombra corta hacia arriba (D24, .q-price-edge) son del bloque, que arma QuoteLayout.
// Dos modos de SPEC 6.2: range es este bloque tal cual, con su linea de rango, y exact es
// el mismo sin esa linea. El disclaimer va en los dos, que lo pide 5.6 en todos los casos.
// hidden no llega aca: el cotizador no monta el bloque.

type PriceBarProps = {
  result: PriceResult
  config: ClientConfig
  display: PriceDisplay
}

export function PriceBar({ result, config, display }: PriceBarProps) {
  const { texts, currency, locale } = config
  return (
    <div data-price>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
          {texts.priceLabel}
        </p>
        <p className="text-2xl font-semibold sm:text-3xl">
          <AnimatedAmount value={result.total} currency={currency} locale={locale} />
        </p>
      </div>
      {display === 'range' ? (
        <p className="mt-0.5 text-right text-sm text-[var(--q-muted)]">
          {texts.priceRangeNote}: {formatCurrency(result.min, currency, locale)}
          {' / '}
          {formatCurrency(result.max, currency, locale)}
        </p>
      ) : null}
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--q-muted)]">{texts.disclaimer}</p>
    </div>
  )
}
