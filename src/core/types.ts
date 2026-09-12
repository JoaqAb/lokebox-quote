// Tipos del dominio de Lokebox Quote. Sin logica, sin dependencias.
// Contrato del motor de precios: SPEC seccion 6. Forma del JSON de cliente: SPEC seccion 10.

export type CurrencyConfig = {
  code: string
  symbol: string
  decimals: number
}

export type UnitsConfig = {
  length: string
  area: string
}

export type ColorsConfig = {
  bg: string
  primary: string
  accent: string
  text: string
  muted: string
}

export type BrandConfig = {
  name: string
  logo: string
  colors: ColorsConfig
  phone: string
  whatsapp: string
  email: string
}

export type SignTypeOption = {
  id: string
  label: string
  priceFixed: number
}

export type MaterialVisual = {
  color: string
  metalness: number
  roughness: number
}

export type MaterialOption = {
  id: string
  label: string
  pricePerArea: number
  visual: MaterialVisual
}

export type LightingMode = 'none' | 'front' | 'back'

export type LightingVisual = {
  mode: LightingMode
}

export type LightingOption = {
  id: string
  label: string
  pricePerArea: number
  visual: LightingVisual
}

export type RangeConfig = {
  min: number
  max: number
  step: number
  default: number
}

export type QuantityConfig = {
  min: number
  max: number
  default: number
}

export type InstallationConfig = {
  fixed: number
  perArea: number
}

export type DiscountTier = {
  minQty: number
  pct: number
}

export type SignOptions = {
  types: SignTypeOption[]
  width: RangeConfig
  height: RangeConfig
  materials: MaterialOption[]
  lighting: LightingOption[]
  installation: InstallationConfig
  quantity: QuantityConfig
  discounts: DiscountTier[]
  rangePct: number
}

// Las claves de texto de SPEC seccion 10. Todas requeridas, todas string.
// Ningun texto visible se escribe en el codigo: sale siempre de aca.
export type ClientTexts = {
  headline: string
  subheadline: string
  configureTitle: string
  typeLabel: string
  widthLabel: string
  heightLabel: string
  materialLabel: string
  lightingLabel: string
  installationLabel: string
  installationYes: string
  installationNo: string
  quantityLabel: string
  priceLabel: string
  priceRangeNote: string
  disclaimer: string
  ctaWhatsapp: string
  ctaForm: string
  formTitle: string
  formName: string
  formContact: string
  formNote: string
  formSubmit: string
  formSending: string
  thanksTitle: string
  thanksBody: string
  viewQuote: string
  quoteTitle: string
  quoteValidity: string
  quoteDateLabel: string
  quoteSelectionTitle: string
  quoteBreakdownTitle: string
  quotePrint: string
  quoteBack: string
  lineMaterial: string
  lineLighting: string
  lineType: string
  lineInstallation: string
  lineDiscount: string
  poweredBy: string
  whatsappMessage: string
}

export type CtaMode = 'whatsapp' | 'form' | 'both'

export type ClientConfig = {
  slug: string
  locale: string
  vertical: string
  currency: CurrencyConfig
  units: UnitsConfig
  brand: BrandConfig
  cta: CtaMode
  poweredBy: boolean
  prices_placeholder: boolean
  options: SignOptions
  texts: ClientTexts
}

// Contrato del motor de precios, exactamente como en SPEC seccion 6.

export type SignSelection = {
  type: string
  width: number
  height: number
  materialId: string
  lightingId: string
  installation: boolean
  quantity: number
}

export type PriceRules = {
  currency: { code: string; symbol: string; decimals: number }
  types: { id: string; label: string; priceFixed: number }[]
  materials: { id: string; label: string; pricePerArea: number }[]
  lighting: { id: string; label: string; pricePerArea: number }[]
  installation: { fixed: number; perArea: number }
  discounts: { minQty: number; pct: number }[]
  rangePct: number
}

export type PriceLineId = 'material' | 'lighting' | 'type' | 'installation' | 'discount'

// Los numeros crudos de cada linea del desglose (SPEC 6, version 1.5). El motor no
// formatea: emite estos valores y la UI los arma con Intl y el locale del cliente.
export type PriceDetailValues =
  | { id: 'material' | 'lighting'; area: number; unitPrice: number }
  | { id: 'type'; fixed: number }
  | { id: 'installation'; fixed: number; perArea: number; area: number }
  | { id: 'discount'; pct: number }

export type PriceLine = {
  id: PriceLineId
  labelKey: string
  // String tecnico y determinista, sin locale y sin moneda. No se muestra en pantalla.
  detail: string
  amount: number
  detailValues?: PriceDetailValues
}

export type PriceResult = {
  area: number
  unitTotal: number
  subtotal: number
  discountPct: number
  total: number
  min: number
  max: number
  lines: PriceLine[]
}
