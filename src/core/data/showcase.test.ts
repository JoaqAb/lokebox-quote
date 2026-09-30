import { describe, expect, it } from 'vitest'
import { isShowcase } from './showcase'

describe('isShowcase', () => {
  it('se activa con ?showcase, con o sin valor', () => {
    expect(isShowcase('?showcase')).toBe(true)
    expect(isShowcase('?showcase=1')).toBe(true)
    expect(isShowcase('?a=1&showcase')).toBe(true)
  })

  it('sin el parametro, el cotizador registra como siempre', () => {
    expect(isShowcase('')).toBe(false)
    expect(isShowcase('?a=1')).toBe(false)
    expect(isShowcase('?showcases=1')).toBe(false)
  })
})
