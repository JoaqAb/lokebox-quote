import type { ComponentType } from 'react'
import type { QuoteSheetRow } from './ui/QuoteSheet'
import type { LoadingBrand } from './ui/LoadingScreen'
import type { PanelField, SelectionValue } from './ui/panelTypes'
import type { CtaMode, CurrencyConfig, PriceDisplay, PriceLine, PriceResult } from './types'

// Contrato de vertical (SPEC 4.4, D133). El core habla con un rubro solo por aca: no importa de
// src/verticals, src/clients ni src/app. El registro, en src/app, mapea el campo vertical del
// JSON a las dos partes (D121): la logica, pura y estatica, y la vista, con React.lazy.
// C es la config de la vertical, S su seleccion y R su resultado de precio, que es el del core mas
// las claves propias que la vertical necesite. Los metodos van con la sintaxis de metodo a
// proposito: el registro guarda verticales de distintos C, S y R bajo el mismo tipo.

// Lo que el core ya valido y la vertical necesita para sus reglas condicionales.
export type VerticalContext = {
  slug: string
  locale: string
  currency: CurrencyConfig
  cta: CtaMode
  display: PriceDisplay
}

export type VerticalLogic<C, S, R extends PriceResult = PriceResult> = {
  // Lee del JSON todo lo que no es del core, o lanza con el slug y la clave en el formato de
  // error del core.
  validate(raw: Readonly<Record<string, unknown>>, ctx: VerticalContext): C
  defaultSelection(config: C): S
  valuesFromSelection(selection: S): Record<string, SelectionValue>
  selectionFromValues(values: Record<string, SelectionValue>): S
  applyFieldChange(
    config: C,
    values: Record<string, SelectionValue>,
    fieldId: string,
    value: SelectionValue,
  ): Record<string, SelectionValue>
  panelFields(config: C, selection: S): PanelField[]
  // Arma sus componentes y compone con composePrice (SPEC 6.3).
  price(config: C, selection: S): R
  quantityOf(selection: S): number
  // Detalle visible de una linea que emite la vertical. La de descuento la formatea el core.
  lineDetail(config: C, line: PriceLine): string | null
  // Una linea opcional encima del desglose.
  breakdownCaption(config: C, result: R): string | null
  // Claves de la hoja (SPEC 8): la query canonica, y null si el link no se cotiza.
  encodeQuery(config: C, selection: S): string
  decodeQuery(config: C, params: URLSearchParams): S | null
  sheetRows(config: C, selection: S): QuoteSheetRow[]
  // Lo que va a la columna selection de leads.
  leadSelection(config: C, selection: S): Record<string, unknown>
  // La plantilla y los tokens de la vertical, armados con buildWhatsappMessage del core.
  whatsappMessage(config: C, selection: S, result: R, display: PriceDisplay): string
}

export type VerticalViewProps<C, S> = {
  config: C
  selection: S
  theme: Record<string, string>
  loading: LoadingBrand
  // La ruta del logo del cliente (D144). Una vertical que no lo dibuja lo ignora.
  logo: string
}

export type VerticalModule<C, S, R extends PriceResult = PriceResult> = {
  logic: VerticalLogic<C, S, R>
  View: ComponentType<VerticalViewProps<C, S>>
}
