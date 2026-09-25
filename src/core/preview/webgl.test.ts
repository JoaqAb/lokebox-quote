import { describe, expect, it } from 'vitest'
import { hasWebGL } from './webgl'

// Movido de la escena de carteles con el codigo en TAREA_033 (D143).
describe('hasWebGL', () => {
  // 12.10
  it('devuelve false en entorno node y no lanza', () => {
    expect(hasWebGL()).toBe(false)
  })
})
