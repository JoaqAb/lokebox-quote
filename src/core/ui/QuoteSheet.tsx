import { formatCurrency, formatLineDetail } from '../pricing/format'
import { resolveLineLabel } from '../pricing/lineLabels'
import type { BrandConfig, ClientTexts, CurrencyConfig, PriceResult } from '../types'

// Hoja de cotizacion imprimible (SPEC 8). Presentacional: sin estado, sin fetch,
// sin three. No conoce ninguna vertical: recibe las filas ya armadas.
// En pantalla se ve con el tema del cliente; impresa sale sobre papel blanco.

export type QuoteSheetRow = { label: string; value: string }

type QuoteSheetProps = {
  brand: BrandConfig
  texts: ClientTexts
  locale: string
  currency: CurrencyConfig
  rows: QuoteSheetRow[]
  price: PriceResult
  date: string
  poweredBy: boolean
  backHref: string
  areaUnit: string
}

export function QuoteSheet({
  brand,
  texts,
  locale,
  currency,
  rows,
  price,
  date,
  poweredBy,
  backHref,
  areaUnit,
}: QuoteSheetProps) {
  return (
    <main className="q-sheet mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5 print:border-black/20">
        <div className="flex items-center gap-3">
          <img src={brand.logo} alt={brand.name} className="h-10 w-auto print:bg-white" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{brand.name}</p>
            <p className="text-xs text-[var(--q-muted)] print:text-black">{brand.phone}</p>
            <p className="text-xs break-words text-[var(--q-muted)] print:text-black">
              {brand.email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
            {texts.quoteDateLabel}
          </p>
          <p className="text-sm tabular-nums">{date}</p>
        </div>
      </header>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{texts.quoteTitle}</h1>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
          {texts.quoteSelectionTitle}
        </h2>
        <dl className="mt-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-t border-white/5 py-2 print:border-black/10"
            >
              <dt className="text-sm text-[var(--q-muted)] print:text-black">{row.label}</dt>
              <dd className="text-right text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
          {texts.quoteBreakdownTitle}
        </h2>
        <ul className="mt-2">
          {price.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-baseline justify-between gap-4 border-t border-white/5 py-2 print:border-black/10"
            >
              <span className="min-w-0 text-sm">{resolveLineLabel(line.labelKey, texts)}</span>
              <span className="ml-auto shrink-0 text-xs text-[var(--q-muted)] tabular-nums print:text-black">
                {line.detailValues === undefined
                  ? null
                  : formatLineDetail(line.detailValues, currency, locale, areaUnit)}
              </span>
              <span className="w-32 shrink-0 text-right text-sm font-medium tabular-nums">
                {formatCurrency(line.amount, currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 border-t border-white/10 pt-4 print:border-black/20">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
          {texts.priceLabel}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatCurrency(price.total, currency, locale)}
        </p>
        <p className="mt-1 text-sm text-[var(--q-muted)] print:text-black">
          {texts.priceRangeNote}: {formatCurrency(price.min, currency, locale)}
          {' / '}
          {formatCurrency(price.max, currency, locale)}
        </p>
      </section>

      <section className="mt-5 space-y-1 text-xs leading-relaxed text-[var(--q-muted)] print:text-black">
        <p>{texts.quoteValidity}</p>
        <p>{texts.disclaimer}</p>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
        <button
          type="button"
          onClick={() => {
            window.print()
          }}
          className="q-control q-on"
        >
          {texts.quotePrint}
        </button>
        <a
          href={backHref}
          className="q-control q-off"
        >
          {texts.quoteBack}
        </a>
      </div>

      {poweredBy ? (
        <footer className="mt-8 text-xs text-[var(--q-muted)] print:mt-6 print:text-black">
          {texts.poweredBy}
        </footer>
      ) : null}
    </main>
  )
}
