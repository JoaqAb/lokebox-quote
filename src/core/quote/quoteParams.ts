import type { SignOptions, SignSelection } from '../types'

// Serializacion de la seleccion en la query de la hoja de cotizacion (TAREA_006 seccion 3).
// Pura, sin React. La URL es canonica: numeros con String(n) y punto decimal, sin importar
// el locale del cliente. El idioma vive en el JSON, no en el link.
// En la URL no va ningun dato personal.

// Orden fijo de claves de SPEC 8. En modo area se escriben estas ocho; `lh` y `d` son
// del modo letters y su sola presencia invalida el link: uno ambiguo no se cotiza.
const KEYS = ['t', 'x', 'w', 'h', 'm', 'l', 'i', 'q'] as const

// Claves del otro modo. Estan escritas aca y no en el modo letters porque la regla de
// SPEC 8 se puede cumplir desde hoy, antes de que ese modo exista.
const OTHER_MODE_KEYS = ['lh', 'd'] as const

export function encodeQuoteParams(selection: SignSelection): string {
  const params = new URLSearchParams()
  params.set('t', selection.type)
  // URLSearchParams codifica el texto solo: espacios, acentos y signos viajan enteros.
  params.set('x', selection.text)
  params.set('w', String(selection.width))
  params.set('h', String(selection.height))
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
  for (const key of KEYS) {
    const value = params.get(key)
    if (value === null) {
      return null
    }
    raw[key] = value
  }

  for (const key of OTHER_MODE_KEYS) {
    if (params.get(key) !== null) {
      return null
    }
  }

  if (!knownId(options.types, raw.t)) {
    return null
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

  const width = parseNumber(raw.w)
  if (width === null || !inRange(width, options.width)) {
    return null
  }
  const height = parseNumber(raw.h)
  if (height === null || !inRange(height, options.height)) {
    return null
  }

  const quantity = parseNumber(raw.q)
  if (quantity === null || !Number.isInteger(quantity) || !inRange(quantity, options.quantity)) {
    return null
  }

  if (raw.i !== '0' && raw.i !== '1') {
    return null
  }

  return {
    type: raw.t,
    text,
    width,
    height,
    materialId: raw.m,
    lightingId: raw.l,
    installation: raw.i === '1',
    quantity,
  }
}
