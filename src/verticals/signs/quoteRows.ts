import { formatLength } from '../../core/pricing/format'
import type { QuoteSheetRow } from '../../core/ui/QuoteSheet'
import type { ClientConfig, SignSelection } from '../../core/types'
import { signIdLabels } from './leadTokens'

// Adaptador de la vertical carteleria para la hoja de cotizacion. Puro, sin React.
// El core recibe las filas ya armadas y no sabe que existen materiales ni carteles.
// Las tres etiquetas de id salen de signIdLabels: aca no se busca por id.

export function signQuoteRows(config: ClientConfig, selection: SignSelection): QuoteSheetRow[] {
  const { texts, units, locale } = config
  const labels = signIdLabels(config, selection)
  const length = (value: number): string => `${formatLength(value, locale)} ${units.length}`
  return [
    { label: texts.typeLabel, value: labels.type },
    { label: texts.widthLabel, value: length(selection.width) },
    { label: texts.heightLabel, value: length(selection.height) },
    { label: texts.materialLabel, value: labels.material },
    { label: texts.lightingLabel, value: labels.lighting },
    {
      label: texts.installationLabel,
      value: selection.installation ? texts.installationYes : texts.installationNo,
    },
    { label: texts.quantityLabel, value: String(selection.quantity) },
  ]
}
