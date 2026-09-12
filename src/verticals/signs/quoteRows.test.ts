import { describe, expect, it } from 'vitest'
import { getClient } from '../../clients'
import { defaultSelection } from '../../core/clientConfig'
import type { ClientConfig, SignSelection } from '../../core/types'
import { signQuoteRows } from './quoteRows'

function clientOrFail(slug: string): ClientConfig {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

function rowsOf(slug: string, overrides: Partial<SignSelection> = {}) {
  const config = clientOrFail(slug)
  return signQuoteRows(config, { ...defaultSelection(config), ...overrides })
}

describe('signQuoteRows', () => {
  // 13.11
  it('northline: siete filas en orden, con las etiquetas del JSON y los valores esperados', () => {
    expect(rowsOf('northline', { installation: true })).toEqual([
      { label: 'Sign type', value: 'Facade sign' },
      { label: 'Width', value: '8 ft' },
      { label: 'Height', value: '3 ft' },
      { label: 'Material', value: 'PVC' },
      { label: 'Lighting', value: 'None' },
      { label: 'Installation', value: 'Yes, install it for me' },
      { label: 'Quantity', value: '1' },
    ])
  })

  // 13.12
  it('norte: medidas con coma decimal y todas las etiquetas en espanol', () => {
    expect(rowsOf('norte')).toEqual([
      { label: 'Tipo de cartel', value: 'Cartel de fachada' },
      { label: 'Ancho', value: '2,5 m' },
      { label: 'Alto', value: '1 m' },
      { label: 'Material', value: 'PVC espumado' },
      { label: 'Iluminación', value: 'Sin luz' },
      { label: 'Instalación', value: 'No, lo instalo yo' },
      { label: 'Cantidad', value: '1' },
    ])
  })

  // 13.13
  it('lanza con un id que no existe, con el id en el mensaje', () => {
    expect(() => rowsOf('northline', { materialId: 'madera' })).toThrow(/madera/)
    expect(() => rowsOf('northline', { type: 'banner' })).toThrow(/banner/)
    expect(() => rowsOf('northline', { lightingId: 'neon' })).toThrow(/neon/)
  })
})
