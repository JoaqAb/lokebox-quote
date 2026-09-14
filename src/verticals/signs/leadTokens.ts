import { pricingModeOf } from '../../core/clientConfig'
import { countLetters } from '../../core/pricing/calculatePrice'
import { formatCurrency, formatLength } from '../../core/pricing/format'
import type { ClientConfig, PriceResult, SignSelection } from '../../core/types'

// Unico lugar que traduce ids de la vertical a etiquetas legibles. Puro, sin React.
// El core no sabe que existen materiales ni carteles: recibe el mensaje ya armado.

// Placeholders de cada plantilla de SPEC 10. Son dos plantillas y no una con huecos:
// cada modo arma exactamente los tokens de la suya.
type CommonTokenKey = 'type' | 'unit' | 'material' | 'lighting' | 'installation' | 'quantity' | 'min' | 'max'
export type SignAreaTokens = Record<CommonTokenKey | 'width' | 'height', string>
export type SignLettersTokens = Record<CommonTokenKey | 'text' | 'letters' | 'letterHeight' | 'depth', string>
// Hacia afuera es un mapa de placeholder a valor, que es lo que consume el core.
export type SignLeadTokens = Record<string, string>

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

export function depthLabelOf(config: ClientConfig, selection: SignSelection): string {
  return labelOf(config.options.depths, selection.depthId, 'profundidad')
}

export function signLeadTokens(
  config: ClientConfig,
  selection: SignSelection,
  result: PriceResult,
): SignLeadTokens {
  const { texts, units, currency, locale } = config
  const labels = signIdLabels(config, selection)
  const common = {
    type: labels.type,
    unit: units.length,
    material: labels.material,
    lighting: labels.lighting,
    installation: selection.installation ? texts.installationYes : texts.installationNo,
    quantity: String(selection.quantity),
    min: formatCurrency(result.min, currency, locale),
    max: formatCurrency(result.max, currency, locale),
  }
  if (pricingModeOf(config.options, selection.type) === 'letters') {
    const letters: SignLettersTokens = {
      ...common,
      text: selection.text,
      letters: String(countLetters(selection.text)),
      letterHeight: formatLength(selection.letterHeight, locale),
      depth: depthLabelOf(config, selection),
    }
    return letters
  }
  const area: SignAreaTokens = {
    ...common,
    width: formatLength(selection.width, locale),
    height: formatLength(selection.height, locale),
  }
  return area
}

// La plantilla del modo del tipo elegido.
export function signWhatsappTemplate(config: ClientConfig, selection: SignSelection): string {
  return pricingModeOf(config.options, selection.type) === 'letters'
    ? config.texts.whatsappMessageLetters
    : config.texts.whatsappMessage
}

// Lo que va a la columna selection: ids, etiquetas legibles y unidad.
export function signLeadSelection(
  config: ClientConfig,
  selection: SignSelection,
): Record<string, unknown> {
  const { options, units } = config
  const measures: Record<string, unknown> =
    pricingModeOf(options, selection.type) === 'letters'
      ? {
          text: selection.text,
          letters: countLetters(selection.text),
          letterHeight: selection.letterHeight,
          unit: units.length,
          depthId: selection.depthId,
          depthLabel: depthLabelOf(config, selection),
        }
      : { width: selection.width, height: selection.height, unit: units.length }
  return {
    type: selection.type,
    typeLabel: labelOf(options.types, selection.type, 'tipo de cartel'),
    ...measures,
    materialId: selection.materialId,
    materialLabel: labelOf(options.materials, selection.materialId, 'material'),
    lightingId: selection.lightingId,
    lightingLabel: labelOf(options.lighting, selection.lightingId, 'iluminacion'),
    installation: selection.installation,
    quantity: selection.quantity,
  }
}
