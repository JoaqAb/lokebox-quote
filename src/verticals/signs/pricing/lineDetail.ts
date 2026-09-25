import { areaUnitSymbol, formatArea, formatCurrency, formatLength } from '../../../core/pricing/format'
import type { CurrencyConfig, PriceLine } from '../../../core/types'
import type { SignDetailValues, SignLineId, SignPriceResult, SignsConfig } from '../types'

// El detalle visible de cada linea de carteles (SPEC 6.1, desde 2.13 de la vertical). El calculo
// emite numeros crudos y el formateo vive aca, con los formateadores del core, la moneda del
// cliente y su locale. Despacha por id y por modo, sin default: una linea nueva rompe la
// compilacion en vez de salir en blanco. En modo letters la cantidad de letras va como numero
// solo y el alto de letra con la unidad de longitud del cliente: ninguna palabra se escribe en el
// codigo. La linea de descuento la formatea el core.
// Hasta la version 2.12 era formatLineDetail de src/core/pricing/format.ts.

export function formatSignLineDetail(
  values: SignDetailValues,
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
  }
}

const SIGN_LINE_IDS: readonly string[] = ['material', 'lighting', 'type', 'installation'] satisfies SignLineId[]

// Los numeros crudos de una linea que emitio esta vertical. Una linea ajena, o sin
// detailValues, lanza: no hay detalle inventado.
function signDetailValues(line: PriceLine): SignDetailValues {
  const values = line.detailValues
  if (
    typeof values !== 'object' ||
    values === null ||
    !('id' in values) ||
    typeof values.id !== 'string' ||
    !SIGN_LINE_IDS.includes(values.id)
  ) {
    throw new Error(`signLineDetail: la linea "${line.id}" no es de carteles`)
  }
  return values as SignDetailValues
}

// lineDetail del contrato (SPEC 4.4).
export function signLineDetail(config: SignsConfig, line: PriceLine): string | null {
  if (line.detailValues === undefined) {
    return null
  }
  return formatSignLineDetail(
    signDetailValues(line),
    config.currency,
    config.locale,
    areaUnitSymbol(config.units.area),
    config.units.length,
  )
}

// breakdownCaption del contrato (SPEC 4.4): el area encima del desglose, solo en modo area. En
// modo letters no hay area: el calculo la deja en 0 y la linea no se muestra.
export function signBreakdownCaption(config: SignsConfig, result: SignPriceResult): string | null {
  return result.letters === undefined ? formatArea(result.area, config.locale, areaUnitSymbol(config.units.area)) : null
}
