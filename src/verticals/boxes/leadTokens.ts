import { formatCurrency, formatInteger, formatLength } from '../../core/pricing/format'
import type { PriceDisplay, PriceResult } from '../../core/types'
import type { QuoteSheetRow } from '../../core/ui/QuoteSheet'
import { findById } from './config'
import type { BoxSelection, BoxesConfig } from './types'

// Unico lugar de cajas que traduce ids a etiquetas legibles (SPEC 21.3): filas de la hoja, columna
// selection del lead y tokens de WhatsApp. Puro, sin React.

export type BoxIdLabels = { style: string; material: string; printing: string }

export function boxIdLabels(config: BoxesConfig, selection: BoxSelection): BoxIdLabels {
  const { options } = config
  return {
    style: findById(options.styles, selection.style, 'estilo').label,
    material: findById(options.materials, selection.materialId, 'material').label,
    printing: findById(options.printing, selection.printingId, 'impresion').label,
  }
}

// Filas de la hoja: estilo, medidas interiores largo por ancho por alto con la unidad, material,
// impresion y cantidad, con Intl y el locale del cliente.
export function boxQuoteRows(config: BoxesConfig, selection: BoxSelection): QuoteSheetRow[] {
  const { texts, units, locale } = config
  const labels = boxIdLabels(config, selection)
  const size = [selection.length, selection.width, selection.height].map((value) => formatLength(value, locale)).join(' x ')
  return [
    { label: texts.styleLabel, value: labels.style },
    { label: texts.dimensionsLabel, value: `${size} ${units.length}` },
    { label: texts.materialLabel, value: labels.material },
    { label: texts.printingLabel, value: labels.printing },
    { label: texts.quantityLabel, value: formatInteger(selection.quantity, locale) },
  ]
}

// Lo que va a la columna selection de leads (SPEC 21.3).
export function boxLeadSelection(config: BoxesConfig, selection: BoxSelection): Record<string, unknown> {
  return {
    style: selection.style,
    length: selection.length,
    width: selection.width,
    height: selection.height,
    unit: config.units.length,
    materialId: selection.materialId,
    printingId: selection.printingId,
    quantity: selection.quantity,
  }
}

// Los diez placeholders de la plantilla; en hidden sin {min} ni {max}, asi ninguna cifra de precio
// puede colarse en el mensaje.
export function boxLeadTokens(config: BoxesConfig, selection: BoxSelection, result: PriceResult, display: PriceDisplay): Record<string, string> {
  const { units, currency, locale } = config
  const labels = boxIdLabels(config, selection)
  return {
    style: labels.style,
    length: formatLength(selection.length, locale),
    width: formatLength(selection.width, locale),
    height: formatLength(selection.height, locale),
    unit: units.length,
    material: labels.material,
    printing: labels.printing,
    quantity: formatInteger(selection.quantity, locale),
    ...(display === 'hidden'
      ? {}
      : { min: formatCurrency(result.min, currency, locale), max: formatCurrency(result.max, currency, locale) }),
  }
}

// La plantilla con precio, o en hidden la que no lo lleva. La validacion ya exigio la segunda.
export function boxWhatsappTemplate(config: BoxesConfig, display: PriceDisplay): string {
  if (display !== 'hidden') {
    return config.texts.whatsappMessage
  }
  const template = config.texts.whatsappMessageHidden
  if (template === undefined) {
    throw new Error(`boxWhatsappTemplate: falta la plantilla sin precio del cliente "${config.slug}"`)
  }
  return template
}
