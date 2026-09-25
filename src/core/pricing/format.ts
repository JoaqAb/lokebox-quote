import type { CurrencyConfig } from '../types'

// Unico lugar del proyecto donde se formatea plata.
// El motor de precios devuelve numeros; el formateo vive aca.

export function formatCurrency(value: number, currency: CurrencyConfig, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    // Sin la clave, el simbolo: es lo que muestran las dos demos. La landing pide el
    // codigo, porque su precio se lee fuera de contexto y un $ solo es ambiguo.
    currencyDisplay: currency.display ?? 'symbol',
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })
  return formatter.format(value)
}

// Medidas de longitud. Mismo criterio que la moneda: el locale del cliente manda,
// asi /d/norte muestra 2,5 y /d/northline 2.5. La unidad la pone quien llama.
export function formatLength(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  return formatter.format(value)
}

// Area con su unidad, en el locale del cliente. El simbolo de la unidad lo pone la
// vertical: core no sabe en que se mide nada.
export function formatArea(area: number, locale: string, areaUnit: string): string {
  return `${formatLength(area, locale)} ${areaUnit}`
}

// Porcentaje en el locale del cliente, hasta dos decimales. Es el detalle de la linea de
// descuento, la unica que formatea el core: las demas las arma su vertical (SPEC 6.1, 2.13).
export function formatPercent(pct: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(pct / 100)
}
