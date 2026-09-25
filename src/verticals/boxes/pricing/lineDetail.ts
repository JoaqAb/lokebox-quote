import { buildWhatsappMessage } from '../../../core/lead/whatsapp'
import { areaUnitSymbol, formatArea, formatCurrency, formatLength } from '../../../core/pricing/format'
import type { PriceLine } from '../../../core/types'
import type { BoxDetailValues, BoxPriceResult, BoxesConfig } from '../types'

// Detalle visible de las lineas de cajas (SPEC 21.2): material e impresion como area de plancha
// con su unidad por precio con su moneda. Armado y preparacion no llevan detalle. La linea de
// descuento la formatea el core.

const DETAIL_IDS: readonly string[] = ['material', 'printing']

function boxDetailValues(line: PriceLine): BoxDetailValues {
  const values = line.detailValues
  if (typeof values !== 'object' || values === null || !('id' in values) || typeof values.id !== 'string' || !DETAIL_IDS.includes(values.id)) {
    throw new Error(`boxLineDetail: la linea "${line.id}" no es de cajas`)
  }
  return values as BoxDetailValues
}

export function boxLineDetail(config: BoxesConfig, line: PriceLine): string | null {
  if (line.detailValues === undefined) {
    return null
  }
  const values = boxDetailValues(line)
  const area = formatArea(values.blankArea, config.locale, areaUnitSymbol(config.units.area))
  return `${area} x ${formatCurrency(values.unitPrice, config.currency, config.locale)}`
}

// Un numero entero de cajas con Intl y el locale del cliente.
export function formatQuantity(quantity: number, locale: string): string {
  return formatLength(quantity, locale)
}

// breakdownCaption del contrato: perBoxCaption con {quantity}, que sale del resultado (D146).
export function boxBreakdownCaption(config: BoxesConfig, result: BoxPriceResult): string {
  return buildWhatsappMessage(config.texts.perBoxCaption, { quantity: formatQuantity(result.quantity, config.locale) })
}
