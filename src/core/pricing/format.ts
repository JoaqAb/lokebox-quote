import type { CurrencyConfig } from '../types'

// Unico lugar del proyecto donde se formatea plata.
// El motor de precios devuelve numeros; el formateo vive aca.

export function formatCurrency(value: number, currency: CurrencyConfig, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })
  return formatter.format(value)
}
