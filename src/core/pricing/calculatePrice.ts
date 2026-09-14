import type { PriceLine, PriceResult, PriceRules, SignSelection } from '../types'

// Motor de precios. Funcion pura, contrato de SPEC seccion 6.
// Prohibido en este archivo: UI, datos remotos, formateo de moneda, fecha o azar.
// Se calcula en precision completa y se redondea solo al final.
// El modo lo decide el pricing del tipo elegido: area (facade, totem) o letters. Las
// reglas del modo letters son aditivas: el modo area no cambia en nada.

// Tope de letras de SPEC 5.3, el mismo que el maximo del texto del cartel.
const MAX_LETTERS = 18

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

// Cantidad de letras: los caracteres del texto sin contar espacios (SPEC 5.3).
// Se cuentan por punto de codigo, asi una letra con tilde es una letra.
export function countLetters(text: string): number {
  return [...text.replace(/\s/g, '')].length
}

// Las tres lineas que dependen del modo, mas los numeros del resultado propios del modo.
type ModeParts = {
  materialCost: number
  lightingCost: number
  installationCost: number
  lines: [PriceLine, PriceLine, PriceLine | null]
  extra: Pick<PriceResult, 'area' | 'letters' | 'letterHeight'>
}

function areaParts(rules: PriceRules, selection: SignSelection, decimals: number): ModeParts {
  requirePositive(selection.width, 'width')
  requirePositive(selection.height, 'height')
  const material = findById(rules.materials, selection.materialId, 'material')
  const lighting = findById(rules.lighting, selection.lightingId, 'iluminacion')

  // 1. Area.
  const area = selection.width * selection.height

  // 2, 3 y 5. Componentes del precio unitario, en precision completa.
  const materialCost = area * material.pricePerArea
  const lightingCost = area * lighting.pricePerArea
  const installationCost = selection.installation
    ? rules.installation.fixed + area * rules.installation.perArea
    : 0

  return {
    materialCost,
    lightingCost,
    installationCost,
    lines: [
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: `${num(area)} x ${material.pricePerArea}`,
        amount: roundTo(materialCost, decimals),
        detailValues: { id: 'material', mode: 'area', area, unitPrice: material.pricePerArea },
      },
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: `${num(area)} x ${lighting.pricePerArea}`,
        amount: roundTo(lightingCost, decimals),
        detailValues: { id: 'lighting', mode: 'area', area, unitPrice: lighting.pricePerArea },
      },
      selection.installation
        ? {
            id: 'installation',
            labelKey: 'lineInstallation',
            detail: `${rules.installation.fixed} + ${num(area)} x ${rules.installation.perArea}`,
            amount: roundTo(installationCost, decimals),
            detailValues: {
              id: 'installation',
              mode: 'area',
              fixed: rules.installation.fixed,
              perArea: rules.installation.perArea,
              area,
            },
          }
        : null,
    ],
    extra: { area },
  }
}

function lettersParts(rules: PriceRules, selection: SignSelection, decimals: number): ModeParts {
  // 1. Cantidad de letras, entre 1 y 18.
  const letters = countLetters(selection.text)
  if (letters < 1 || letters > MAX_LETTERS) {
    throw new Error(
      `calculatePrice: el texto debe tener entre 1 y ${String(MAX_LETTERS)} letras sin contar espacios, tiene ${String(letters)}`,
    )
  }
  requirePositive(selection.letterHeight, 'letterHeight')
  const material = findById(rules.materials, selection.materialId, 'material')
  const lighting = findById(rules.lighting, selection.lightingId, 'iluminacion')
  const depth = findById(rules.depths, selection.depthId, 'profundidad')

  // Sin estos precios la config es invalida, no un cero silencioso.
  const pricePerLetterHeight = material.pricePerLetterHeight
  if (pricePerLetterHeight === undefined) {
    throw new Error(`calculatePrice: el material "${material.id}" no tiene pricePerLetterHeight`)
  }
  const pricePerLetter = lighting.pricePerLetter
  if (pricePerLetter === undefined) {
    throw new Error(`calculatePrice: la iluminacion "${lighting.id}" no tiene pricePerLetter`)
  }

  const letterHeight = selection.letterHeight
  const perLetter = rules.installation.perLetter

  // 2 a 6. Componentes del precio unitario, en precision completa.
  const materialCost = letters * letterHeight * pricePerLetterHeight * depth.factor
  const lightingCost = letters * pricePerLetter
  const installationCost = selection.installation ? rules.installation.fixed + letters * perLetter : 0

  return {
    materialCost,
    lightingCost,
    installationCost,
    lines: [
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: `${String(letters)} x ${num(letterHeight)} x ${String(pricePerLetterHeight)} x ${String(depth.factor)}`,
        amount: roundTo(materialCost, decimals),
        detailValues: {
          id: 'material',
          mode: 'letters',
          letters,
          letterHeight,
          unitPrice: pricePerLetterHeight,
          depthFactor: depth.factor,
        },
      },
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: `${String(letters)} x ${String(pricePerLetter)}`,
        amount: roundTo(lightingCost, decimals),
        detailValues: { id: 'lighting', mode: 'letters', letters, unitPrice: pricePerLetter },
      },
      selection.installation
        ? {
            id: 'installation',
            labelKey: 'lineInstallation',
            detail: `${String(rules.installation.fixed)} + ${String(letters)} x ${String(perLetter)}`,
            amount: roundTo(installationCost, decimals),
            detailValues: {
              id: 'installation',
              mode: 'letters',
              fixed: rules.installation.fixed,
              perLetter,
              letters,
            },
          }
        : null,
    ],
    extra: { area: 0, letters, letterHeight },
  }
}

export function calculatePrice(rules: PriceRules, selection: SignSelection): PriceResult {
  requirePositive(selection.quantity, 'quantity')

  const signType = findById(rules.types, selection.type, 'tipo de cartel')
  const pricing: unknown = signType.pricing
  if (pricing !== 'area' && pricing !== 'letters') {
    throw new Error(`calculatePrice: el tipo "${signType.id}" no tiene un pricing valido: ${String(pricing)}`)
  }

  const decimals = rules.currency.decimals
  const parts =
    pricing === 'area'
      ? areaParts(rules, selection, decimals)
      : lettersParts(rules, selection, decimals)

  // 4. Recargo fijo del tipo, igual en los dos modos.
  const typeCost = signType.priceFixed

  const unitTotal = parts.materialCost + parts.lightingCost + typeCost + parts.installationCost

  // Subtotal.
  const subtotal = unitTotal * selection.quantity

  // Descuento por cantidad: el tramo de mayor minQty que cumpla, nunca dos.
  let discountPct = 0
  let bestMinQty = 0
  for (const tier of rules.discounts) {
    if (selection.quantity >= tier.minQty && tier.minQty >= bestMinQty) {
      bestMinQty = tier.minQty
      discountPct = tier.pct
    }
  }

  // Total y rango.
  const total = roundTo(subtotal * (1 - discountPct / 100), decimals)
  const min = roundTo(total * (1 - rules.rangePct / 100), decimals)
  const max = roundTo(total * (1 + rules.rangePct / 100), decimals)

  // Lineas del desglose. Los importes son por unidad, no por cantidad.
  // La linea de iluminacion se incluye siempre, incluso con importe 0.
  const [materialLine, lightingLine, installationLine] = parts.lines
  const lines: PriceLine[] = [materialLine, lightingLine]

  if (signType.priceFixed > 0) {
    lines.push({
      id: 'type',
      labelKey: 'lineType',
      detail: `${signType.priceFixed}`,
      amount: roundTo(typeCost, decimals),
      detailValues: { id: 'type', fixed: signType.priceFixed },
    })
  }

  if (installationLine !== null) {
    lines.push(installationLine)
  }

  if (discountPct > 0) {
    lines.push({
      id: 'discount',
      labelKey: 'lineDiscount',
      detail: `${discountPct}%`,
      amount: -roundTo((unitTotal * discountPct) / 100, decimals),
      detailValues: { id: 'discount', pct: discountPct },
    })
  }

  return { ...parts.extra, unitTotal, subtotal, discountPct, total, min, max, lines }
}
