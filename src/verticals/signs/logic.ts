import { buildWhatsappMessage } from '../../core/lead/whatsapp'
import type { VerticalLogic } from '../../core/vertical'
import { defaultSelection, pricingModeOf, priceRulesFromClient, validateSigns } from './config'
import { applyFieldChange, buildPanelFields, selectionFromValues, valuesFromSelection } from './fields'
import { signLeadSelection, signLeadTokens, signWhatsappTemplate } from './leadTokens'
import { calculateSignPrice } from './pricing/calculateSignPrice'
import { signBreakdownCaption, signLineDetail } from './pricing/lineDetail'
import { decodeQuoteParams, encodeQuoteParams } from './query'
import { signQuoteRows } from './quoteRows'
import type { SignPriceResult, SignSelection, SignsConfig } from './types'

// La logica de la vertical carteleria: implementa el contrato de SPEC 4.4 (D133). Pura, sin
// React ni three, y se importa de forma estatica desde el registro de src/app. La vista va aparte,
// en ./view, con React.lazy.

export const signsLogic: VerticalLogic<SignsConfig, SignSelection, SignPriceResult> = {
  validate: validateSigns,
  defaultSelection,
  valuesFromSelection,
  selectionFromValues,
  applyFieldChange,
  panelFields: buildPanelFields,
  price: (config, selection) => calculateSignPrice(priceRulesFromClient(config), selection),
  quantityOf: (selection) => selection.quantity,
  lineDetail: signLineDetail,
  breakdownCaption: signBreakdownCaption,
  encodeQuery: (config, selection) => encodeQuoteParams(selection, pricingModeOf(config.options, selection.type)),
  decodeQuery: (config, params) => decodeQuoteParams(config.options, params),
  sheetRows: signQuoteRows,
  leadSelection: signLeadSelection,
  whatsappMessage: (config, selection, result, display) =>
    buildWhatsappMessage(signWhatsappTemplate(config, selection, display), signLeadTokens(config, selection, result, display)),
}
