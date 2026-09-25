import { DISCOUNT_LINE_ID } from '../pricing/composePrice'
import { formatCurrency, formatPercent } from '../pricing/format'
import { resolveTextKey } from '../textKeys'
import type { BrandConfig, ClientTexts, CurrencyConfig, PriceDisplay, PriceLine, PriceResult } from '../types'

// Hoja de cotizacion imprimible (SPEC 8). Presentacional: sin estado, sin fetch,
// sin three. No conoce ninguna vertical: recibe las filas ya armadas.
// En pantalla se ve con el tema del cliente; impresa sale sobre papel blanco.
// Dos plantillas, por el modo de SPEC 6.2: con precio, y brief de pedido sin precio.
// La segunda es la de hidden y comparte marca, seleccion, fecha, validez y disclaimer;
// no lleva desglose, total ni rango. Sacar dos secciones la deja mas corta, nunca mas
// larga, asi que sigue entrando en una pagina.
// Desde la version 2.13 (D133) el detalle de las lineas de la vertical lo arma la vertical
// (lineDetail de SPEC 4.4); el core formatea solo el porcentaje del descuento.

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
  lineDetail: (line: PriceLine) => string | null
  display: PriceDisplay
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
  lineDetail,
  display,
}: QuoteSheetProps) {
  const withPrice = display !== 'hidden'
  return (
    <main className="q-sheet mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-wrap items-start justify-between gap-4 q-hairline border-b pb-5">
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
              className="flex items-baseline justify-between gap-4 q-hairline border-t py-2"
            >
              <dt className="text-sm text-[var(--q-muted)] print:text-black">{row.label}</dt>
              <dd className="text-right text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {withPrice ? (
      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
          {texts.quoteBreakdownTitle}
        </h2>
        <ul className="mt-2">
          {price.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-baseline justify-between gap-4 q-hairline border-t py-2"
            >
              <span className="min-w-0 text-sm">{resolveTextKey(line.labelKey, texts)}</span>
              <span className="ml-auto shrink-0 text-xs text-[var(--q-muted)] tabular-nums print:text-black">
                {line.id === DISCOUNT_LINE_ID ? formatPercent(price.discountPct, locale) : lineDetail(line)}
              </span>
              <span className="w-32 shrink-0 text-right text-sm font-medium tabular-nums">
                {formatCurrency(line.amount, currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      {withPrice ? (
      <section className="mt-6 q-hairline border-t pt-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase print:text-black">
          {texts.priceLabel}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {formatCurrency(price.total, currency, locale)}
        </p>
        {display === 'range' ? (
          <p className="mt-1 text-sm text-[var(--q-muted)] print:text-black">
            {texts.priceRangeNote}: {formatCurrency(price.min, currency, locale)}
            {' / '}
            {formatCurrency(price.max, currency, locale)}
          </p>
        ) : null}
      </section>
      ) : null}

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
