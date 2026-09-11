import type { ClientTexts } from '../types'

// Puente entre el labelKey que emite el motor de precios y las claves de texts.
// Pura, sin React. Si la clave no existe, lanza: no hay etiqueta vacia en pantalla.

export function resolveLineLabel(labelKey: string, texts: ClientTexts): string {
  const table: Record<string, string> = texts
  const value = table[labelKey]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`resolveLineLabel: clave de texto desconocida: "${labelKey}"`)
  }
  return value
}
