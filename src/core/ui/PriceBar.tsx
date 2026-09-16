import { formatCurrency } from '../pricing/format'
import type { ClientConfig, PriceDisplay, PriceResult } from '../types'
import { AnimatedAmount } from './AnimatedAmount'

// Bloque de precio. Siempre visible: en mobile fijo al pie de la ventana,
// en desktop al pie de la columna del panel. El disclaimer va siempre, sin acordeon.
// Borde superior y sombra corta hacia arriba (D24, .q-price-edge): sin la sombra el
// control que queda debajo del bloque se lee cortado y no como contenido que sigue.
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
    <div className="q-hairline q-panel q-price-edge border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
        {texts.priceLabel}
      </p>
      <p className="mt-1 text-3xl font-semibold sm:text-4xl">
        <AnimatedAmount value={result.total} currency={currency} locale={locale} />
      </p>
      {display === 'range' ? (
        <p className="mt-1 text-sm text-[var(--q-muted)]">
          {texts.priceRangeNote}: {formatCurrency(result.min, currency, locale)}
          {' / '}
          {formatCurrency(result.max, currency, locale)}
        </p>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-[var(--q-muted)]">{texts.disclaimer}</p>
    </div>
  )
}
