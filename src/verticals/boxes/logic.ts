import { buildWhatsappMessage } from '../../core/lead/whatsapp'
import type { VerticalLogic } from '../../core/vertical'
import { defaultSelection, validateBoxes } from './config'
import { applyFieldChange, buildPanelFields, selectionFromValues, valuesFromSelection } from './fields'
import { boxLeadSelection, boxLeadTokens, boxQuoteRows, boxWhatsappTemplate } from './leadTokens'
import { calculateBoxPrice } from './pricing/calculateBoxPrice'
import { boxBreakdownCaption, boxLineDetail } from './pricing/lineDetail'
import { decodeBoxQuery, encodeBoxQuery } from './query'
import type { BoxPriceResult, BoxSelection, BoxesConfig } from './types'

// La logica de la vertical cajas: el contrato de SPEC 4.4 con lo de SPEC 21. Pura, sin React ni
// three, importada de forma estatica desde el registro de src/app. La vista va aparte, en ./view.

export const boxesLogic: VerticalLogic<BoxesConfig, BoxSelection, BoxPriceResult> = {
  validate: validateBoxes,
  defaultSelection,
  valuesFromSelection,
  selectionFromValues,
  applyFieldChange,
  panelFields: buildPanelFields,
  price: calculateBoxPrice,
  quantityOf: (selection) => selection.quantity,
  lineDetail: boxLineDetail,
  breakdownCaption: boxBreakdownCaption,
  encodeQuery: (_config, selection) => encodeBoxQuery(selection),
  decodeQuery: (config, params) => decodeBoxQuery(config.options, params),
  sheetRows: boxQuoteRows,
  leadSelection: boxLeadSelection,
  whatsappMessage: (config, selection, result, display) =>
    buildWhatsappMessage(boxWhatsappTemplate(config, display), boxLeadTokens(config, selection, result, display)),
}
