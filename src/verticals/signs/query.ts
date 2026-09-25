import type { PricingMode, SignOptions, SignSelection } from './types'

// Serializacion de la seleccion en la query de la hoja de cotizacion (SPEC 8). Desde la version
// 2.13 (D133) las claves son de la vertical: son encodeQuery y decodeQuery del contrato de 4.4.
// Hasta 2.12 era src/core/quote/quoteParams.ts. Las claves no cambian y los links ya publicados
// siguen valiendo (D122).
// Pura, sin React. La URL es canonica: numeros con String(n) y punto decimal, sin importar
// el locale del cliente. El idioma vive en el JSON, no en el link.
// En la URL no va ningun dato personal.

// Claves por modo, en el orden fijo de SPEC 8: t, x, w, h, lh, d, m, l, i, q. Se escriben
// solo las del modo del tipo; una clave del otro modo presente invalida el link, porque
// uno ambiguo no se cotiza.
const MODE_KEYS: Record<PricingMode, readonly string[]> = {
  area: ['w', 'h'],
  letters: ['lh', 'd'],
}

const COMMON_KEYS = ['t', 'x', 'm', 'l', 'i', 'q'] as const

export function encodeQuoteParams(selection: SignSelection, mode: PricingMode): string {
  const params = new URLSearchParams()
  params.set('t', selection.type)
  // URLSearchParams codifica el texto solo: espacios, acentos y signos viajan enteros.
  params.set('x', selection.text)
  if (mode === 'area') {
    params.set('w', String(selection.width))
    params.set('h', String(selection.height))
  } else {
    params.set('lh', String(selection.letterHeight))
    params.set('d', selection.depthId)
  }
  params.set('m', selection.materialId)
  params.set('l', selection.lightingId)
  params.set('i', selection.installation ? '1' : '0')
  params.set('q', String(selection.quantity))
  return params.toString()
}

// Sin defaults y sin clamp: cualquier desvio devuelve null y la pagina muestra ErrorScreen.
// Una hoja con un precio que el visitante nunca configuro es peor que un error.

function parseNumber(raw: string): number | null {
  if (raw.trim().length === 0) {
    return null
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function knownId(list: { id: string }[], id: string): boolean {
  return list.some((item) => item.id === id)
}

// El step no se valida a proposito: un valor intermedio se cotiza tal cual, porque
// redondearlo en silencio cambiaria el precio que el visitante vio.
function inRange(value: number, range: { min: number; max: number }): boolean {
  return value >= range.min && value <= range.max
}

export function decodeQuoteParams(
  options: SignOptions,
  params: URLSearchParams,
): SignSelection | null {
  const raw: Record<string, string> = {}
  for (const key of COMMON_KEYS) {
    const value = params.get(key)
    if (value === null) {
      return null
    }
    raw[key] = value
  }

  const signType = options.types.find((item) => item.id === raw.t)
  if (signType === undefined) {
    return null
  }
  const mode = signType.pricing
  const otherMode: PricingMode = mode === 'area' ? 'letters' : 'area'

  for (const key of MODE_KEYS[mode]) {
    const value = params.get(key)
    if (value === null) {
      return null
    }
    raw[key] = value
  }
  for (const key of MODE_KEYS[otherMode]) {
    if (params.get(key) !== null) {
      return null
    }
  }

  const text = raw.x
  if (text.length === 0 || text.length > options.signText.maxLength) {
    return null
  }
  if (!knownId(options.materials, raw.m)) {
    return null
  }
  if (!knownId(options.lighting, raw.l)) {
    return null
  }

  const quantity = parseNumber(raw.q)
  if (quantity === null || !Number.isInteger(quantity) || !inRange(quantity, options.quantity)) {
    return null
  }

  if (raw.i !== '0' && raw.i !== '1') {
    return null
  }

  // Las medidas del otro modo no viajan en el link y el motor no las usa. La seleccion
  // igual las lleva siempre (SPEC 5.2), asi que se completan con el default del JSON:
  // no cambian el precio, que depende solo de las claves del modo.
  const common = {
    type: raw.t,
    text,
    materialId: raw.m,
    lightingId: raw.l,
    installation: raw.i === '1',
    quantity,
  }

  if (mode === 'area') {
    const width = parseNumber(raw.w)
    if (width === null || !inRange(width, options.width)) {
      return null
    }
    const height = parseNumber(raw.h)
    if (height === null || !inRange(height, options.height)) {
      return null
    }
    return {
      ...common,
      width,
      height,
      letterHeight: options.letterHeight.default,
      depthId: options.depths[0].id,
    }
  }

  const letterHeight = parseNumber(raw.lh)
  if (letterHeight === null || !inRange(letterHeight, options.letterHeight)) {
    return null
  }
  if (!knownId(options.depths, raw.d)) {
    return null
  }
  return {
    ...common,
    width: options.width.default,
    height: options.height.default,
    letterHeight,
    depthId: raw.d,
  }
}
