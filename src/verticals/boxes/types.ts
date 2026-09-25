import type { CtaMode, CurrencyConfig, MaterialVisual, PriceDisplay, PriceResult, RangeConfig } from '../../core/types'

// Tipos de la vertical cajas (SPEC 21, D123 a D125 y D141 a D146). Sin logica, sin dependencias.

// Las dos combinaciones de unidades que acepta cajas (SPEC 21.2).
export type BoxUnits = { length: 'in'; area: 'sqft' } | { length: 'cm'; area: 'm2' }

// Un lado de una pieza de la plancha (D142): l por largo mas w por ancho mas h por alto mas add,
// con add en la unidad de largo del cliente.
export type LinearSide = { l: number; w: number; h: number; add: number }

export type BlankPiece = { length: LinearSide; width: LinearSide }

export type BoxShape = 'mailer' | 'two-piece' | 'shipping'

// lidDepth solo en two-piece: el alto de la tapa como fraccion del alto. Es dato de la escena.
export type BoxStyleVisual = { shape: BoxShape; lidDepth?: number }

export type BoxStyle = {
  id: string
  label: string
  // Fijo de armado por caja.
  assembly: number
  blank: BlankPiece[]
  visual: BoxStyleVisual
}

// El visual de un material de carteles mas el espesor que dibuja la escena.
export type BoxMaterialVisual = MaterialVisual & { thicknessMm: number }

export type BoxMaterial = {
  id: string
  label: string
  pricePerArea: number
  // Sin la clave el material vale para todos los estilos.
  styles?: string[]
  visual: BoxMaterialVisual
}

export type PrintLogo = 'none' | 'accent' | 'original'

export type BoxPrinting = {
  id: string
  label: string
  pricePerArea: number
  // Preparacion por pedido.
  setup: number
  visual: { logo: PrintLogo; inside: boolean }
}

// Un escalon de cantidad (D141): la cantidad solo puede ser uno de estos qty.
export type QuantityTier = { qty: number; pct: number }

export type BoxDefaults = { style: string; materialId: string; printingId: string; quantity: number }

export type BoxOptions = {
  styles: BoxStyle[]
  length: RangeConfig
  width: RangeConfig
  height: RangeConfig
  materials: BoxMaterial[]
  printing: BoxPrinting[]
  quantities: QuantityTier[]
  defaults: BoxDefaults
  rangePct: number
}

// Las 17 claves de texts de cajas (SPEC 21.4) y la plantilla sin precio, condicional.
export type BoxTexts = {
  styleLabel: string
  dimensionsLabel: string
  lengthLabel: string
  widthLabel: string
  heightLabel: string
  materialLabel: string
  printingLabel: string
  quantityLabel: string
  previewZoomLabel: string
  viewClosed: string
  viewOpen: string
  lineMaterial: string
  linePrinting: string
  lineAssembly: string
  lineSetup: string
  perBoxCaption: string
  whatsappMessage: string
  whatsappMessageHidden?: string
}

export type BoxesConfig = {
  slug: string
  locale: string
  currency: CurrencyConfig
  cta: CtaMode
  display: PriceDisplay
  units: BoxUnits
  options: BoxOptions
  texts: BoxTexts
}

// Seleccion de SPEC 21.1: medidas interiores en la unidad de largo del cliente.
export type BoxSelection = {
  style: string
  length: number
  width: number
  height: number
  materialId: string
  printingId: string
  quantity: number
}

export type BoxLineId = 'material' | 'printing' | 'assembly' | 'setup'

// Numeros crudos de material e impresion: el area de plancha por caja y el precio por area.
export type BoxDetailValues = { id: 'material' | 'printing'; blankArea: number; unitPrice: number }

// El PriceResult del core mas el area de plancha por caja sin redondear y la cantidad (D146).
export type BoxPriceResult = PriceResult & { blankArea: number; quantity: number }
