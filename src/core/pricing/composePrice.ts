import type { PriceInput, PriceLine, PriceResult } from '../types'

// Composicion del precio (SPEC 6.3, D134): la parte del calculo que comparten todos los rubros.
// La vertical arma sus componentes ya calculados y los pasa aca. Funcion pura: sin UI, sin datos
// remotos, sin formateo de moneda, sin fecha ni azar. Se calcula en precision completa y se
// redondea solo al final.

export const DISCOUNT_LINE_ID = 'discount'
export const DISCOUNT_LABEL_KEY = 'lineDiscount'

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// El tramo de mayor minQty que cumple, nunca dos. Sin tramo, 0.
function discountFor(quantity: number, discounts: PriceInput['discounts']): number {
  let discountPct = 0
  let bestMinQty = 0
  for (const tier of discounts) {
    if (quantity >= tier.minQty && tier.minQty >= bestMinQty) {
      bestMinQty = tier.minQty
      discountPct = tier.pct
    }
  }
  return discountPct
}

export function composePrice(input: PriceInput): PriceResult {
  const { decimals, quantity } = input
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`composePrice: quantity debe ser mayor a 0, llego: ${String(quantity)}`)
  }

  // Suma en el orden de los componentes: la aritmetica de punto flotante depende del orden.
  let unitTotal = 0
  for (const component of input.unit) {
    unitTotal += component.cost
  }
  const subtotal = unitTotal * quantity
  const discountPct = discountFor(quantity, input.discounts)

  let orderTotal = 0
  for (const component of input.order) {
    orderTotal += component.cost
  }

  const total = roundTo(subtotal * (1 - discountPct / 100) + orderTotal, decimals)
  const min = roundTo(total * (1 - input.rangePct / 100), decimals)
  const max = roundTo(total * (1 + input.rangePct / 100), decimals)

  // Los importes de unit y del descuento son por unidad; los de order, por pedido.
  const priced = (component: PriceInput['unit'][number]): PriceLine => ({
    ...component.line,
    amount: roundTo(component.cost, decimals),
  })
  const lines: PriceLine[] = input.unit.map(priced)
  if (discountPct > 0) {
    lines.push({
      id: DISCOUNT_LINE_ID,
      labelKey: DISCOUNT_LABEL_KEY,
      detail: `${discountPct}%`,
      amount: -roundTo((unitTotal * discountPct) / 100, decimals),
      detailValues: { id: DISCOUNT_LINE_ID, pct: discountPct },
    })
  }
  lines.push(...input.order.map(priced))

  return { unitTotal, subtotal, discountPct, total, min, max, lines }
}
