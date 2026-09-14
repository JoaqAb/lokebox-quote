import type { CurrencyConfig, PriceDetailValues } from '../types'

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

// Area con su unidad, en el locale del cliente. El simbolo de la unidad lo pone la
// vertical: core no sabe que una cartelera se mide en metros cuadrados.
export function formatArea(area: number, locale: string, areaUnit: string): string {
  return `${formatLength(area, locale)} ${areaUnit}`
}

// El detalle visible de cada linea del desglose. El motor emite numeros crudos y el
// formateo vive aca, con Intl, la moneda del cliente y su locale. Despacha por id y por
// modo, sin default: una linea nueva en el motor rompe la compilacion en vez de salir en
// blanco. En modo letters la cantidad de letras va como numero solo y el alto de letra
// con la unidad de longitud del cliente: ninguna palabra se escribe en el codigo.
export function formatLineDetail(
  values: PriceDetailValues,
  currency: CurrencyConfig,
  locale: string,
  areaUnit: string,
  lengthUnit: string,
): string {
  const money = (value: number): string => formatCurrency(value, currency, locale)
  const count = (value: number): string => formatLength(value, locale)
  switch (values.id) {
    case 'material':
    case 'lighting':
      if (values.mode === 'area') {
        return `${formatArea(values.area, locale, areaUnit)} x ${money(values.unitPrice)}`
      }
      if (values.id === 'material') {
        return `${count(values.letters)} x ${formatLength(values.letterHeight, locale)} ${lengthUnit} x ${money(values.unitPrice)} x ${count(values.depthFactor)}`
      }
      return `${count(values.letters)} x ${money(values.unitPrice)}`
    case 'type':
      return money(values.fixed)
    case 'installation':
      if (values.mode === 'area') {
        return `${money(values.fixed)} + ${formatArea(values.area, locale, areaUnit)} x ${money(values.perArea)}`
      }
      return `${money(values.fixed)} + ${count(values.letters)} x ${money(values.perLetter)}`
    case 'discount':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }).format(values.pct / 100)
  }
}
