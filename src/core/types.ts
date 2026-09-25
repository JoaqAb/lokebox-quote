// Tipos del core de Lokebox Quote. Sin logica, sin dependencias, sin vocabulario de ningun rubro.
// Desde la version 2.13 (D133) lo de cada vertical vive en su modulo: aca quedan la moneda, la
// marca, los colores, el cta, la visibilidad de precio, los textos del core y la composicion del
// precio de SPEC 6.3. Los tipos del contrato de vertical de SPEC 4.4 estan en ./vertical.ts.

export type CurrencyConfig = {
  code: string
  symbol: string
  decimals: number
  // Como se nombra la moneda al formatear: "symbol" da $250 y "code" da USD 250.
  // Opcional, y sin la clave vale "symbol": los JSON de cliente no la traen.
  display?: 'symbol' | 'code'
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

// Acabado de un material: elige el generador de mapas del pipeline del core (SPEC 10, version
// 2.1, D52). El pipeline es de toda vertical; que superficie lleva que acabado lo decide cada una.
export type Finish = 'foam' | 'brushed' | 'polished'

// Parametros fisicos de un material (SPEC 10, version 2.1, D52). Son del cliente y van al
// JSON; finish elige el generador de mapas, que es del codigo (src/core/preview/finishMaps).
// Todo numerico va entre 0 y 1. Sin transmission, thickness ni ior: la transmision esta
// descartada (D54). Lo lee readMaterialVisual, que el core exporta a las verticales.
export type MaterialVisual = {
  color: string
  finish: Finish
  metalness: number
  roughness: number
  specularIntensity: number
  clearcoat: number
  clearcoatRoughness: number
  anisotropy: number
  normalScale: number
  // Cuanto de la luz trasera deja pasar la cara: 0 es opaca, el acrilico opal enciende.
  translucency: number
}

// Rango de un slider del JSON: lo lee readRange con las reglas de minimo, maximo, paso y default.
export type RangeConfig = {
  min: number
  max: number
  step: number
  default: number
}

// Cantidad del pedido: la lee readQuantity.
export type QuantityConfig = {
  min: number
  max: number
  default: number
}

// Tramo de descuento por cantidad de SPEC 6.3.
export type DiscountTier = {
  minQty: number
  pct: number
}

// Las 27 claves de texts que consume el core o las paginas genericas (SPEC 10, D135).
export type CoreTexts = {
  headline: string
  subheadline: string
  configureTitle: string
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
  lineDiscount: string
  poweredBy: string
  loadingLabel: string
}

// El texts del cliente, que en el JSON sigue siendo un solo objeto (D135): las 27 del core
// validadas, mas las demas claves de texto del JSON tal cual, que valida la vertical. Contra este
// objeto se resuelven las etiquetas de linea y de panel que emite la vertical, por su clave.
export type ClientTexts = CoreTexts & Readonly<Record<string, string>>

export type CtaMode = 'whatsapp' | 'form' | 'both'

// Modo de visibilidad de precio (SPEC 6.2). Los cinco valores son capacidades del core,
// no variantes por mercado ni por canal. En la etapa 1 de D30 estan implementados exact,
// range y hidden; gated e internal los rechaza la validacion al cargar.
export type PriceDisplay = 'exact' | 'range' | 'gated' | 'hidden' | 'internal'

// La config de cliente que valida el core (SPEC 10). Lo demas del JSON es de la vertical, que lo
// lee de json con su validate (SPEC 4.4).
export type ClientConfig = {
  slug: string
  locale: string
  vertical: string
  currency: CurrencyConfig
  brand: BrandConfig
  cta: CtaMode
  poweredBy: boolean
  prices_placeholder: boolean
  // Opcional, como en el JSON: sin la clave el modo es range. El default lo resuelve
  // priceDisplayOf de clientConfig.ts, que es el unico lugar que lo conoce.
  pricing?: { display: PriceDisplay }
  texts: ClientTexts
  // El JSON del cliente tal cual, para el validate de su vertical.
  json: Readonly<Record<string, unknown>>
}

// Composicion del precio, exactamente como en SPEC 6.3 (D134).

export type PriceLine = {
  // Lo define la vertical, salvo "discount", que lo agrega composePrice.
  id: string
  // Clave de texts, no texto literal.
  labelKey: string
  // String tecnico y determinista, sin locale y sin moneda. No se muestra en pantalla.
  detail: string
  // Redondeado a decimals; negativo en discount.
  amount: number
  // Numeros crudos: los tipa y los formatea la vertical.
  detailValues?: unknown
}

// Un componente del precio, en precision completa.
export type PriceComponent = { line: Omit<PriceLine, 'amount'>; cost: number }

export type PriceInput = {
  decimals: number
  quantity: number
  // Por unidad, en el orden del desglose.
  unit: PriceComponent[]
  // Puede estar vacia.
  discounts: DiscountTier[]
  // Por pedido: no se multiplican por la cantidad ni se descuentan. Puede estar vacia.
  order: PriceComponent[]
  rangePct: number
}

export type PriceResult = {
  unitTotal: number
  subtotal: number
  discountPct: number
  total: number
  min: number
  max: number
  lines: PriceLine[]
}
