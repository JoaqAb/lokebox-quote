import { formatCurrency } from '../../core/pricing/format'
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

// Sin decimales cuando es entero, con uno cuando no.
function measure(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function signLeadTokens(
  config: ClientConfig,
  selection: SignSelection,
  result: PriceResult,
): SignLeadTokens {
  const { options, texts, units, currency, locale } = config
  return {
    type: labelOf(options.types, selection.type, 'tipo de cartel'),
    width: measure(selection.width),
    height: measure(selection.height),
    unit: units.length,
    material: labelOf(options.materials, selection.materialId, 'material'),
    lighting: labelOf(options.lighting, selection.lightingId, 'iluminacion'),
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
