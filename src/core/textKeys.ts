import type { ClientTexts } from './types'

// Puente entre una clave de texto que emite la vertical (la labelKey de una linea del desglose o
// de un campo del panel) y el texts del cliente. Pura, sin React. Si la clave no existe, lanza:
// no hay etiqueta vacia en pantalla. El core no sabe que claves son: las resuelve por su nombre
// contra el texts del cliente (D135).
// Hasta la version 2.12 era resolveLineLabel de src/core/pricing/lineLabels.ts.

export function resolveTextKey(key: string, texts: ClientTexts): string {
  const table: Readonly<Record<string, string | undefined>> = texts
  const value = table[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`resolveTextKey: clave de texto desconocida: "${key}"`)
  }
  return value
}
