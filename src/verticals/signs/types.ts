import type {
  CtaMode,
  CurrencyConfig,
  DiscountTier,
  MaterialVisual,
  PriceDisplay,
  PriceResult,
  QuantityConfig,
  RangeConfig,
} from '../../core/types'

// Tipos de la vertical carteleria (SPEC 4.2, 5, 6.1 y 10). Sin logica, sin dependencias.
// Hasta la version 2.12 vivian en src/core/types.ts; desde 2.13 (D133) son de la vertical.

// Que se mide y en que unidad es del rubro (D136).
export type UnitsConfig = {
  length: string
  area: string
}

// Una foto de fondo del preview, por angulo (SPEC 12, version 1.12). Las fotos son de la
// vertical (D121): carteles las exige.
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

// Anclaje del totem en una foto (SPEC 10, version 1.15). x e y son el punto de apoyo de la
// base, en fraccion del ancho y del alto, origen arriba a la izquierda. metersToWidth es la
// fraccion del ancho que ocupa un metro a la distancia del totem, mas cerca que la fachada.
// La camara no esta aca: sigue saliendo del anchor de la foto.
export type PhotoGroundAnchor = {
  x: number
  y: number
  metersToWidth: number
  // Fraccion del alto de la foto donde la fachada toca la vereda en la columna del apoyo
  // (SPEC 10, version 2.7, D85). El receptor de piso del totem termina ahi.
  wallY: number
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
  // Obligatorio si el cliente ofrece el tipo totem: lo exige la validacion.
  anchorGround?: PhotoGroundAnchor
  light: PhotoLight
}

// Modo de precio de un tipo de cartel (SPEC 5.1): el motor ramifica por aca.
export type PricingMode = 'area' | 'letters'

// Como se monta el panel de un tipo de area (SPEC 10, version 2.4, D68): al ras o con
// separadores. Es dato del negocio, no del codigo.
export type Mount = 'flush' | 'standoff'

export type SignTypeOption = {
  id: string
  label: string
  priceFixed: number
  pricing: PricingMode
  // Obligatorio en los tipos de area, ausente en los de letters: lo exige la validacion.
  visual?: { mount: Mount }
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

export type InstallationConfig = {
  fixed: number
  perArea: number
  perLetter: number
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

// Las 20 claves de texts de carteles (SPEC 10, D135), mas las dos plantillas sin precio del
// modo hidden: opcionales en la forma y exigidas por validacion condicional cuando el modo es
// hidden y el cta incluye WhatsApp, igual que anchorGround con el tipo totem.
export type SignTexts = {
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
  lineMaterial: string
  lineLighting: string
  lineType: string
  lineInstallation: string
  whatsappMessage: string
  whatsappMessageLetters: string
  whatsappMessageHidden?: string
  whatsappMessageHiddenLetters?: string
}

// Las claves de texto que siempre estan. Las dos plantillas del modo hidden son
// opcionales, asi que una etiqueta de panel nunca puede apuntar a ellas y este tipo lo
// impide en compilacion.
export type RequiredSignTextKey = {
  [K in keyof SignTexts]-?: undefined extends SignTexts[K] ? never : K
}[keyof SignTexts]

// La config de la vertical: lo que valida su validate, mas lo del core que usan sus reglas y
// su formateo (SPEC 4.4).
export type SignsConfig = {
  slug: string
  locale: string
  currency: CurrencyConfig
  cta: CtaMode
  display: PriceDisplay
  units: UnitsConfig
  photos: ClientPhoto[]
  options: SignOptions
  texts: SignTexts
}

// Contrato del calculo de carteles, exactamente como en SPEC 6.1.

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

export type SignLineId = 'material' | 'lighting' | 'type' | 'installation'

// Los numeros crudos de cada linea del desglose (SPEC 6, version 1.5). El calculo no
// formatea: emite estos valores y la vertical los arma con Intl y el locale del cliente.
// Material, iluminacion e instalacion discriminan por modo (SPEC 6, version 1.8). La linea de
// descuento la agrega composePrice del core, con su propio detailValues.
export type SignDetailValues =
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

// El PriceResult del core mas area, letters y letterHeight (SPEC 6.1).
export type SignPriceResult = PriceResult & {
  // 0 en modo letters.
  area: number
  // Solo en modo letters.
  letters?: number
  letterHeight?: number
}
