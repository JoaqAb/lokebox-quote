import { formatLength } from '../../core/pricing/format'
import type { QuoteSheetRow } from '../../core/ui/QuoteSheet'
import { pricingModeOf } from './config'
import type { SignSelection, SignsConfig } from './types'
import { depthLabelOf, signIdLabels } from './leadTokens'

// Adaptador de la vertical carteleria para la hoja de cotizacion. Puro, sin React.
// El core recibe las filas ya armadas y no sabe que existen materiales ni carteles.
// Las tres etiquetas de id salen de signIdLabels: aca no se busca por id.

export function signQuoteRows(config: SignsConfig, selection: SignSelection): QuoteSheetRow[] {
  const { texts, units, locale } = config
  const labels = signIdLabels(config, selection)
  const length = (value: number): string => `${formatLength(value, locale)} ${units.length}`
  // En modo letters la cantidad de letras sale del texto, asi que el texto va a la hoja,
  // y la profundidad se ve aca porque en el desglose viaja como factor del material.
  const measures: QuoteSheetRow[] =
    pricingModeOf(config.options, selection.type) === 'letters'
      ? [
          { label: texts.signTextLabel, value: selection.text },
          { label: texts.letterHeightLabel, value: length(selection.letterHeight) },
          { label: texts.depthLabel, value: depthLabelOf(config, selection) },
        ]
      : [
          { label: texts.widthLabel, value: length(selection.width) },
          { label: texts.heightLabel, value: length(selection.height) },
        ]
  return [
    { label: texts.typeLabel, value: labels.type },
    ...measures,
    { label: texts.materialLabel, value: labels.material },
    { label: texts.lightingLabel, value: labels.lighting },
    {
      label: texts.installationLabel,
      value: selection.installation ? texts.installationYes : texts.installationNo,
    },
    { label: texts.quantityLabel, value: String(selection.quantity) },
  ]
}
