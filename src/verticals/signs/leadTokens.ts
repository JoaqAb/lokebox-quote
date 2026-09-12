import { formatCurrency, formatLength } from '../../core/pricing/format'
import type { ClientConfig, PriceResult, SignSelection } from '../../core/types'

// Unico lugar que traduce ids de la vertical a etiquetas legibles. Puro, sin React.
// El core no sabe que existen materiales ni carteles: recibe el mensaje ya armado.

export type SignLeadTokens = Record<
  | 'type'
  | 'width'
  | 'height'
  | 'unit'
  | 'material'
  | 'lighting'
  | 'installation'
  | 'quantity'
  | 'min'
  | 'max',
  string
>

function labelOf(list: { id: string; label: string }[], id: string, what: string): string {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`signLeadTokens: ${what} invalido: "${id}"`)
  }
  return found.label
}

// Las tres etiquetas de id de la vertical, en un solo lugar. Las usan el mensaje de
// WhatsApp y las filas de la hoja de cotizacion, asi la busqueda por id no se duplica.
export type SignIdLabels = { type: string; material: string; lighting: string }

export function signIdLabels(config: ClientConfig, selection: SignSelection): SignIdLabels {
  const { options } = config
  return {
    type: labelOf(options.types, selection.type, 'tipo de cartel'),
    material: labelOf(options.materials, selection.materialId, 'material'),
    lighting: labelOf(options.lighting, selection.lightingId, 'iluminacion'),
  }
}

export function signLeadTokens(
  config: ClientConfig,
  selection: SignSelection,
  result: PriceResult,
): SignLeadTokens {
  const { texts, units, currency, locale } = config
  const labels = signIdLabels(config, selection)
  return {
    type: labels.type,
    width: formatLength(selection.width, locale),
    height: formatLength(selection.height, locale),
    unit: units.length,
    material: labels.material,
    lighting: labels.lighting,
    installation: selection.installation ? texts.installationYes : texts.installationNo,
    quantity: String(selection.quantity),
    min: formatCurrency(result.min, currency, locale),
    max: formatCurrency(result.max, currency, locale),
  }
}

// Lo que va a la columna selection: ids, etiquetas legibles y unidad.
export function signLeadSelection(
  config: ClientConfig,
  selection: SignSelection,
): Record<string, unknown> {
  const { options, units } = config
  return {
    type: selection.type,
    typeLabel: labelOf(options.types, selection.type, 'tipo de cartel'),
    width: selection.width,
    height: selection.height,
    unit: units.length,
    materialId: selection.materialId,
    materialLabel: labelOf(options.materials, selection.materialId, 'material'),
    lightingId: selection.lightingId,
    lightingLabel: labelOf(options.lighting, selection.lightingId, 'iluminacion'),
    installation: selection.installation,
    quantity: selection.quantity,
  }
}
