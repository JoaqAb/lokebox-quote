// Deteccion de WebGL. Si el navegador no lo tiene, la vista no monta el canvas. En el core desde
// TAREA_033 (D143).
// El resultado se cachea a nivel de modulo: crear un canvas por render es caro.

let cached: boolean | null = null

export function hasWebGL(): boolean {
  if (cached !== null) {
    return cached
  }
  if (typeof document === 'undefined') {
    cached = false
    return cached
  }
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    cached = context !== null
  } catch {
    cached = false
  }
  return cached
}
