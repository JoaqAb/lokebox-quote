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

// Una foto de fondo del preview, por angulo (SPEC 12, version 1.12).
// El anclaje dice donde y de que tamano cae el cartel sobre esa foto y desde donde la
// tomo la camara; la luz dice de donde viene el sol en ella, para que el volumen case.
export type PhotoAnchor = {
  // Centro del cartel, en fraccion del ancho y del alto, origen arriba a la izquierda.
  x: number
  y: number
  // Que fraccion del ancho de la foto ocupa un metro de cartel. Se expresa asi, y no
  // como un factor abstracto, para calcularlo contra una medida conocida de la foto.
  metersToWidth: number
  // La camara orbita alrededor del cartel, que no rota: yaw positivo a la derecha del
  // frente del cartel, pitch negativo por debajo de su centro, fov vertical en grados.
  cameraYawDeg: number
  cameraPitchDeg: number
  fovDeg: number
}

export type PhotoLight = {
  ambient: number
  keyIntensity: number
  keyAzimuthDeg: number
  keyElevationDeg: number
}

export type ClientPhoto = {
  id: string
  // Etiqueta visible del angulo. Vive aca y no en texts porque la cantidad de fotos
  // varia por cliente: es el mismo criterio que el label de types y de materials.
  label: string
  src: string
  anchor: PhotoAnchor
  light: PhotoLight
}

// Modo de precio de un tipo de cartel (SPEC 5.1): el motor ramifica por aca.
export type PricingMode = 'area' | 'letters'

export type SignTypeOption = {
  id: string
  label: string
  priceFixed: number
  pricing: PricingMode
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
  // Precio por letra y por unidad de alto de letra. Sin el, el material no entra en
  // letras corporeas: el JSON decide asi que materiales se ofrecen en ese modo.
  pricePerLetterHeight?: number
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
  pricePerLetter?: number
  visual: LightingVisual
}

// Profundidad de las letras corporeas. El factor multiplica el precio del material; el
// visual dice cuanto mide, para que el preview dibuje esa profundidad y no una inventada.
export type DepthVisual = {
  depthMeters: number
}

export type DepthOption = {
  id: string
  label: string
  factor: number
  visual: DepthVisual
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
  perLetter: number
}

export type DiscountTier = {
  minQty: number
  pct: number
}

// Texto que va en la cara del cartel (SPEC 5.2). El default viene del JSON y el
// visitante lo edita: es lo que hace que el preview se lea como su propio cartel.
export type SignTextConfig = {
  default: string
  maxLength: number
}

export type SignOptions = {
  types: SignTypeOption[]
  signText: SignTextConfig
  width: RangeConfig
  height: RangeConfig
  letterHeight: RangeConfig
  depths: DepthOption[]
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
  signTextLabel: string
  letterHeightLabel: string
  depthLabel: string
  previewZoomLabel: string
  viewSignOnly: string
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
  whatsappMessageLetters: string
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
  photos: ClientPhoto[]
  options: SignOptions
  texts: ClientTexts
}

// Contrato del motor de precios, exactamente como en SPEC seccion 6.

// La seleccion conserva siempre los valores de los dos modos, con default del JSON: asi
// cambiar de tipo no deja estado invalido y el motor ignora lo que no aplica (SPEC 5.2).
export type SignSelection = {
  type: string
  text: string
  width: number
  height: number
  letterHeight: number
  depthId: string
  materialId: string
  lightingId: string
  installation: boolean
  quantity: number
}

export type PriceRules = {
  currency: { code: string; symbol: string; decimals: number }
  types: { id: string; label: string; priceFixed: number; pricing: PricingMode }[]
  materials: { id: string; label: string; pricePerArea: number; pricePerLetterHeight?: number }[]
  lighting: { id: string; label: string; pricePerArea: number; pricePerLetter?: number }[]
  depths: { id: string; label: string; factor: number }[]
  installation: { fixed: number; perArea: number; perLetter: number }
  discounts: { minQty: number; pct: number }[]
  rangePct: number
}

export type PriceLineId = 'material' | 'lighting' | 'type' | 'installation' | 'discount'

// Los numeros crudos de cada linea del desglose (SPEC 6, version 1.5). El motor no
// formatea: emite estos valores y la UI los arma con Intl y el locale del cliente.
// Material, iluminacion e instalacion discriminan por modo (SPEC 6, version 1.8).
export type PriceDetailValues =
  | { id: 'material' | 'lighting'; mode: 'area'; area: number; unitPrice: number }
  | {
      id: 'material'
      mode: 'letters'
      letters: number
      letterHeight: number
      unitPrice: number
      depthFactor: number
    }
  | { id: 'lighting'; mode: 'letters'; letters: number; unitPrice: number }
  | { id: 'type'; fixed: number }
  | { id: 'installation'; mode: 'area'; fixed: number; perArea: number; area: number }
  | { id: 'installation'; mode: 'letters'; fixed: number; perLetter: number; letters: number }
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
  // 0 en modo letters.
  area: number
  // Solo en modo letters.
  letters?: number
  letterHeight?: number
  unitTotal: number
  subtotal: number
  discountPct: number
  total: number
  min: number
  max: number
  lines: PriceLine[]
}
