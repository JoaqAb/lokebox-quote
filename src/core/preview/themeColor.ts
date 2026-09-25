import { Color } from 'three'

// Un color del tema del cliente para la escena (SPEC 4.1): la variable CSS que arma el core con
// los colores del JSON, leida como Color de three. Lanza si falta: una escena sin su color de
// marca no se dibuja con uno inventado. En el core desde TAREA_033 (D143).
export function themeColor(theme: Record<string, string>, key: string): Color {
  const value = theme[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`falta la variable de tema "${key}"`)
  }
  return new Color(value)
}
