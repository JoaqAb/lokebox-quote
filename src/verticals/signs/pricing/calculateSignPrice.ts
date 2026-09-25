import { composePrice, roundTo } from '../../../core/pricing/composePrice'
import type { PriceComponent } from '../../../core/types'
import type { PriceRules, SignDetailValues, SignLineId, SignPriceResult, SignSelection } from '../types'

// Calculo de carteles. Funcion pura, contrato de SPEC 6.1.
// Prohibido en este archivo: UI, datos remotos, formateo de moneda, fecha o azar.
// Se calcula en precision completa y se redondea solo al final.
// El modo lo decide el pricing del tipo elegido: area (facade, totem) o letters. Las
// reglas del modo letters son aditivas: el modo area no cambia en nada.
// Desde la version 2.13 (D133, D134) es de la vertical y no del core: arma sus componentes por
// unidad y compone con composePrice (SPEC 6.3). El resultado es identico al de 2.12, verificado
// contra el snapshot de la fase 1 de TAREA_032 (D122).

// Tope de letras de SPEC 5.3, el mismo que el maximo del texto del cartel.
const MAX_LETTERS = 18

// Formato unico de los numeros que aparecen en `detail`.
// Es un string tecnico y determinista, no un precio formateado.
function num(value: number): string {
  return String(roundTo(value, 4))
}

function findById<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`calculateSignPrice: ${what} invalido: "${id}"`)
  }
  return found
}

function requirePositive(value: number, what: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`calculateSignPrice: ${what} debe ser mayor a 0, llego: ${String(value)}`)
  }
}

// Cantidad de letras: los caracteres del texto sin contar espacios (SPEC 5.3).
// Se cuentan por punto de codigo, asi una letra con tilde es una letra.
export function countLetters(text: string): number {
  return [...text.replace(/\s/g, '')].length
}

// Una linea de la vertical, con sus numeros crudos tipados.
type SignLine = { id: SignLineId; labelKey: string; detail: string; detailValues: SignDetailValues }

function component(line: SignLine, cost: number): PriceComponent {
  return { line, cost }
}

// Los tres componentes que dependen del modo, mas los numeros del resultado propios del modo.
// La instalacion es null cuando no se pidio: esa linea entra solo cuando suma.
type ModeParts = {
  material: PriceComponent
  lighting: PriceComponent
  installation: PriceComponent | null
  extra: Pick<SignPriceResult, 'area' | 'letters' | 'letterHeight'>
}

function areaParts(rules: PriceRules, selection: SignSelection): ModeParts {
  requirePositive(selection.width, 'width')
  requirePositive(selection.height, 'height')
  const material = findById(rules.materials, selection.materialId, 'material')
  const lighting = findById(rules.lighting, selection.lightingId, 'iluminacion')

  // 1. Area.
  const area = selection.width * selection.height

  // 2, 3 y 5. Componentes del precio unitario, en precision completa.
  const materialCost = area * material.pricePerArea
  const lightingCost = area * lighting.pricePerArea

  return {
    material: component(
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: `${num(area)} x ${material.pricePerArea}`,
        detailValues: { id: 'material', mode: 'area', area, unitPrice: material.pricePerArea },
      },
      materialCost,
    ),
    lighting: component(
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: `${num(area)} x ${lighting.pricePerArea}`,
        detailValues: { id: 'lighting', mode: 'area', area, unitPrice: lighting.pricePerArea },
      },
      lightingCost,
    ),
    installation: selection.installation
      ? component(
          {
            id: 'installation',
            labelKey: 'lineInstallation',
            detail: `${rules.installation.fixed} + ${num(area)} x ${rules.installation.perArea}`,
            detailValues: {
              id: 'installation',
              mode: 'area',
              fixed: rules.installation.fixed,
              perArea: rules.installation.perArea,
              area,
            },
          },
          rules.installation.fixed + area * rules.installation.perArea,
        )
      : null,
    extra: { area },
  }
}

function lettersParts(rules: PriceRules, selection: SignSelection): ModeParts {
  // 1. Cantidad de letras, entre 1 y 18.
  const letters = countLetters(selection.text)
  if (letters < 1 || letters > MAX_LETTERS) {
    throw new Error(
      `calculateSignPrice: el texto debe tener entre 1 y ${String(MAX_LETTERS)} letras sin contar espacios, tiene ${String(letters)}`,
    )
  }
  requirePositive(selection.letterHeight, 'letterHeight')
  const material = findById(rules.materials, selection.materialId, 'material')
  const lighting = findById(rules.lighting, selection.lightingId, 'iluminacion')
  const depth = findById(rules.depths, selection.depthId, 'profundidad')

  // Sin estos precios la config es invalida, no un cero silencioso.
  const pricePerLetterHeight = material.pricePerLetterHeight
  if (pricePerLetterHeight === undefined) {
    throw new Error(`calculateSignPrice: el material "${material.id}" no tiene pricePerLetterHeight`)
  }
  const pricePerLetter = lighting.pricePerLetter
  if (pricePerLetter === undefined) {
    throw new Error(`calculateSignPrice: la iluminacion "${lighting.id}" no tiene pricePerLetter`)
  }

  const letterHeight = selection.letterHeight
  const perLetter = rules.installation.perLetter

  // 2 a 6. Componentes del precio unitario, en precision completa.
  const materialCost = letters * letterHeight * pricePerLetterHeight * depth.factor
  const lightingCost = letters * pricePerLetter

  return {
    material: component(
      {
        id: 'material',
        labelKey: 'lineMaterial',
        detail: `${String(letters)} x ${num(letterHeight)} x ${String(pricePerLetterHeight)} x ${String(depth.factor)}`,
        detailValues: {
          id: 'material',
          mode: 'letters',
          letters,
          letterHeight,
          unitPrice: pricePerLetterHeight,
          depthFactor: depth.factor,
        },
      },
      materialCost,
    ),
    lighting: component(
      {
        id: 'lighting',
        labelKey: 'lineLighting',
        detail: `${String(letters)} x ${String(pricePerLetter)}`,
        detailValues: { id: 'lighting', mode: 'letters', letters, unitPrice: pricePerLetter },
      },
      lightingCost,
    ),
    installation: selection.installation
      ? component(
          {
            id: 'installation',
            labelKey: 'lineInstallation',
            detail: `${String(rules.installation.fixed)} + ${String(letters)} x ${String(perLetter)}`,
            detailValues: {
              id: 'installation',
              mode: 'letters',
              fixed: rules.installation.fixed,
              perLetter,
              letters,
            },
          },
          rules.installation.fixed + letters * perLetter,
        )
      : null,
    extra: { area: 0, letters, letterHeight },
  }
}

export function calculateSignPrice(rules: PriceRules, selection: SignSelection): SignPriceResult {
  requirePositive(selection.quantity, 'quantity')

  const signType = findById(rules.types, selection.type, 'tipo de cartel')
  const pricing: unknown = signType.pricing
  if (pricing !== 'area' && pricing !== 'letters') {
    throw new Error(`calculateSignPrice: el tipo "${signType.id}" no tiene un pricing valido: ${String(pricing)}`)
  }

  const parts = pricing === 'area' ? areaParts(rules, selection) : lettersParts(rules, selection)

  // Componentes por unidad en el orden del desglose y de la suma de 2.12: material, iluminacion,
  // recargo del tipo e instalacion. La iluminacion va siempre, incluso con importe 0; el tipo y la
  // instalacion, solo cuando suman. Sumar un componente que no entra seria sumar 0: el resultado
  // de punto flotante es el mismo.
  const unit: PriceComponent[] = [parts.material, parts.lighting]
  if (signType.priceFixed > 0) {
    // 4. Recargo fijo del tipo, igual en los dos modos.
    unit.push(
      component(
        { id: 'type', labelKey: 'lineType', detail: `${signType.priceFixed}`, detailValues: { id: 'type', fixed: signType.priceFixed } },
        signType.priceFixed,
      ),
    )
  }
  if (parts.installation !== null) {
    unit.push(parts.installation)
  }

  // Carteles no usa componentes por pedido (D134): el descuento y el rango los aplica el core.
  const composed = composePrice({
    decimals: rules.currency.decimals,
    quantity: selection.quantity,
    unit,
    discounts: rules.discounts,
    order: [],
    rangePct: rules.rangePct,
  })
  return { ...parts.extra, ...composed }
}
