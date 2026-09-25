import { composePrice, roundTo } from '../../../core/pricing/composePrice'
import type { PriceComponent, RangeConfig } from '../../../core/types'
import { findById, materialsForStyle } from '../config'
import type { BlankPiece, BoxDetailValues, BoxLineId, BoxPriceResult, BoxSelection, BoxUnits, BoxesConfig, LinearSide } from '../types'

// Calculo de cajas (SPEC 21.2). Funcion pura: sin UI, sin datos remotos, sin formateo, sin fecha
// ni azar. Se calcula en precision completa y se redondea solo al final, en composePrice.
// Componentes por caja, en orden: material y impresion sobre el area de plancha, que entran
// siempre, y el armado del estilo si es mayor que 0. Por pedido, la preparacion de la impresion si
// es mayor que 0: no se multiplica por la cantidad ni se descuenta. El factor del escalon es el
// descuento por tramos del core (D141).

// Conversion fija del area de la plancha a la unidad de area del cliente.
const SQUARE_INCHES_PER_SQFT = 144
const SQUARE_CM_PER_M2 = 10000

export function areaDivisor(units: BoxUnits): number {
  return units.length === 'in' ? SQUARE_INCHES_PER_SQFT : SQUARE_CM_PER_M2
}

function sideLength(side: LinearSide, selection: BoxSelection): number {
  return side.l * selection.length + side.w * selection.width + side.h * selection.height + side.add
}

// Area de plancha por caja (D142): la suma de largo por ancho de cada pieza, en la unidad de area.
export function blankArea(blank: BlankPiece[], selection: BoxSelection, units: BoxUnits): number {
  let area = 0
  for (const piece of blank) {
    area += sideLength(piece.length, selection) * sideLength(piece.width, selection)
  }
  return area / areaDivisor(units)
}

// Forma unica de los numeros de detail: string tecnico, no un precio formateado.
function num(value: number): string {
  return String(roundTo(value, 4))
}

function requireInRange(value: number, range: RangeConfig, what: string): void {
  if (!Number.isFinite(value) || value < range.min || value > range.max) {
    throw new Error(`calculateBoxPrice: ${what} fuera de rango: ${String(value)}`)
  }
}

type BoxLine = { id: BoxLineId; labelKey: string; detail: string; detailValues?: BoxDetailValues }

function component(line: BoxLine, cost: number): PriceComponent {
  return { line, cost }
}

export function calculateBoxPrice(config: BoxesConfig, selection: BoxSelection): BoxPriceResult {
  const { options } = config
  const style = findById(options.styles, selection.style, 'estilo')
  const material = findById(options.materials, selection.materialId, 'material')
  if (!materialsForStyle(options.materials, style.id).includes(material)) {
    throw new Error(`calculateBoxPrice: el material "${material.id}" no vale para el estilo "${style.id}"`)
  }
  const printing = findById(options.printing, selection.printingId, 'impresion')
  requireInRange(selection.length, options.length, 'largo')
  requireInRange(selection.width, options.width, 'ancho')
  requireInRange(selection.height, options.height, 'alto')
  if (!options.quantities.some((tier) => tier.qty === selection.quantity)) {
    throw new Error(`calculateBoxPrice: cantidad fuera de los escalones: ${String(selection.quantity)}`)
  }

  const area = blankArea(style.blank, selection, config.units)
  const unit: PriceComponent[] = [
    component(
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: `${num(area)} x ${String(material.pricePerArea)}`,
        detailValues: { id: 'material', blankArea: area, unitPrice: material.pricePerArea },
      },
      area * material.pricePerArea,
    ),
    component(
      {
        id: 'printing',
        labelKey: 'linePrinting',
        detail: `${num(area)} x ${String(printing.pricePerArea)}`,
        detailValues: { id: 'printing', blankArea: area, unitPrice: printing.pricePerArea },
      },
      area * printing.pricePerArea,
    ),
  ]
  if (style.assembly > 0) {
    unit.push(component({ id: 'assembly', labelKey: 'lineAssembly', detail: String(style.assembly) }, style.assembly))
  }
  const order: PriceComponent[] =
    printing.setup > 0 ? [component({ id: 'setup', labelKey: 'lineSetup', detail: String(printing.setup) }, printing.setup)] : []

  const composed = composePrice({
    decimals: config.currency.decimals,
    quantity: selection.quantity,
    unit,
    discounts: options.quantities.map((tier) => ({ minQty: tier.qty, pct: tier.pct })),
    order,
    rangePct: options.rangePct,
  })
  return { ...composed, blankArea: area, quantity: selection.quantity }
}
