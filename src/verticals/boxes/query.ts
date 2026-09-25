import { materialsForStyle } from './config'
import type { BoxOptions, BoxSelection } from './types'

// Claves de la hoja de cajas (SPEC 21.3 y 8), en orden y todas siempre: s estilo, l largo, w ancho,
// h alto, m material, p impresion, q cantidad. Numeros con punto decimal. Pura, sin React.
// Sin defaults y sin clamp: una clave faltante, repetida o de mas, un id que no existe, un material
// que no vale para el estilo, una medida fuera de rango o una q fuera de los escalones devuelven
// null y la pagina muestra el error. El paso del slider no se valida.

const KEYS = ['s', 'l', 'w', 'h', 'm', 'p', 'q'] as const

export function encodeBoxQuery(selection: BoxSelection): string {
  const params = new URLSearchParams()
  params.set('s', selection.style)
  params.set('l', String(selection.length))
  params.set('w', String(selection.width))
  params.set('h', String(selection.height))
  params.set('m', selection.materialId)
  params.set('p', selection.printingId)
  params.set('q', String(selection.quantity))
  return params.toString()
}

function parseNumber(raw: string): number | null {
  if (raw.trim().length === 0) {
    return null
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function inRange(value: number | null, range: { min: number; max: number }): value is number {
  return value !== null && value >= range.min && value <= range.max
}

export function decodeBoxQuery(options: BoxOptions, params: URLSearchParams): BoxSelection | null {
  const present = [...params.keys()]
  if (present.length !== KEYS.length || !KEYS.every((key) => present.includes(key))) {
    return null
  }
  const get = (key: (typeof KEYS)[number]): string => params.get(key) ?? ''
  const style = options.styles.find((item) => item.id === get('s'))
  if (style === undefined) {
    return null
  }
  const material = materialsForStyle(options.materials, style.id).find((item) => item.id === get('m'))
  if (material === undefined) {
    return null
  }
  const printing = options.printing.find((item) => item.id === get('p'))
  if (printing === undefined) {
    return null
  }
  const length = parseNumber(get('l'))
  const width = parseNumber(get('w'))
  const height = parseNumber(get('h'))
  if (!inRange(length, options.length) || !inRange(width, options.width) || !inRange(height, options.height)) {
    return null
  }
  const quantity = parseNumber(get('q'))
  if (quantity === null || !options.quantities.some((tier) => tier.qty === quantity)) {
    return null
  }
  return { style: style.id, length, width, height, materialId: material.id, printingId: printing.id, quantity }
}
