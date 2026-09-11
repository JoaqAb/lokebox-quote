import type { PriceLine, PriceResult, PriceRules, SignSelection } from '../types'

// Motor de precios. Funcion pura, contrato de SPEC seccion 6.
// Prohibido en este archivo: UI, datos remotos, formateo de moneda, fecha o azar.
// Se calcula en precision completa y se redondea solo al final.

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// Formato unico de los numeros que aparecen en `detail`.
// Es un string tecnico y determinista, no un precio formateado.
function num(value: number): string {
  return String(roundTo(value, 4))
}

function findById<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`calculatePrice: ${what} invalido: "${id}"`)
  }
  return found
}

function requirePositive(value: number, what: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`calculatePrice: ${what} debe ser mayor a 0, llego: ${String(value)}`)
  }
}

export function calculatePrice(rules: PriceRules, selection: SignSelection): PriceResult {
  requirePositive(selection.width, 'width')
  requirePositive(selection.height, 'height')
  requirePositive(selection.quantity, 'quantity')

  const signType = findById(rules.types, selection.type, 'tipo de cartel')
  const material = findById(rules.materials, selection.materialId, 'material')
  const lighting = findById(rules.lighting, selection.lightingId, 'iluminacion')

  const decimals = rules.currency.decimals

  // 1. Area.
  const area = selection.width * selection.height

  // 2 a 5. Componentes del precio unitario, en precision completa.
  const materialCost = area * material.pricePerArea
  const lightingCost = area * lighting.pricePerArea
  const typeCost = signType.priceFixed
  const installationCost = selection.installation
    ? rules.installation.fixed + area * rules.installation.perArea
    : 0

  const unitTotal = materialCost + lightingCost + typeCost + installationCost

  // 6. Subtotal.
  const subtotal = unitTotal * selection.quantity

  // 7. Descuento por cantidad: el tramo de mayor minQty que cumpla, nunca dos.
  let discountPct = 0
  let bestMinQty = 0
  for (const tier of rules.discounts) {
    if (selection.quantity >= tier.minQty && tier.minQty >= bestMinQty) {
      bestMinQty = tier.minQty
      discountPct = tier.pct
    }
  }

  // 8. Total y rango.
  const total = roundTo(subtotal * (1 - discountPct / 100), decimals)
  const min = roundTo(total * (1 - rules.rangePct / 100), decimals)
  const max = roundTo(total * (1 + rules.rangePct / 100), decimals)

  // Lineas del desglose. Los importes son por unidad, no por cantidad.
  // La linea de iluminacion se incluye siempre, incluso con importe 0.
  const lines: PriceLine[] = [
    {
      id: 'material',
      labelKey: 'lineMaterial',
      detail: `${num(area)} x ${material.pricePerArea}`,
      amount: roundTo(materialCost, decimals),
    },
    {
      id: 'lighting',
      labelKey: 'lineLighting',
      detail: `${num(area)} x ${lighting.pricePerArea}`,
      amount: roundTo(lightingCost, decimals),
    },
  ]

  if (signType.priceFixed > 0) {
    lines.push({
      id: 'type',
      labelKey: 'lineType',
      detail: `${signType.priceFixed}`,
      amount: roundTo(typeCost, decimals),
    })
  }

  if (selection.installation) {
    lines.push({
      id: 'installation',
      labelKey: 'lineInstallation',
      detail: `${rules.installation.fixed} + ${num(area)} x ${rules.installation.perArea}`,
      amount: roundTo(installationCost, decimals),
    })
  }

  if (discountPct > 0) {
    lines.push({
      id: 'discount',
      labelKey: 'lineDiscount',
      detail: `${discountPct}%`,
      amount: -roundTo((unitTotal * discountPct) / 100, decimals),
    })
  }

  return { area, unitTotal, subtotal, discountPct, total, min, max, lines }
}
