import { describe, expect, it } from 'vitest'
import { formatQuoteDate } from './quoteDate'

// El 11 de septiembre de 2026 en el calendario local de quien mira. Se construye con el
// constructor local a proposito: Date.UTC fija un instante, no un dia, y en cualquier zona
// al oeste de Greenwich ese instante cae el dia anterior (docs/DECISIONES.md, 11/09/2026).
const ONCE_DE_SEPTIEMBRE = new Date(2026, 8, 11)

describe('formatQuoteDate', () => {
  // 13.9
  it('usa el orden de fecha del locale', () => {
    expect(formatQuoteDate(ONCE_DE_SEPTIEMBRE, 'en')).toBe('09/11/2026')
    expect(formatQuoteDate(ONCE_DE_SEPTIEMBRE, 'es-AR')).toBe('11/09/2026')
  })

  // 13.9
  it('formatea el dia calendario local, no el de UTC', () => {
    const tarde = new Date(2026, 8, 11, 23, 30)
    expect(formatQuoteDate(tarde, 'es-AR')).toBe('11/09/2026')
  })
})
