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

// Medidas de longitud. Mismo criterio que la moneda: el locale del cliente manda,
// asi /d/norte muestra 2,5 y /d/northline 2.5. La unidad la pone quien llama.
export function formatLength(value: number, locale: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  return formatter.format(value)
}
