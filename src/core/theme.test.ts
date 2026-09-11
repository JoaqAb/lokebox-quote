import { describe, expect, it } from 'vitest'
import { getClient } from '../clients'
import { themeFromClient } from './theme'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('themeFromClient', () => {
  // 12.8
  it('devuelve las cinco variables CSS con los valores del JSON, para los dos clientes', () => {
    expect(themeFromClient(clientOrFail('northline'))).toEqual({
      '--q-bg': '#07080A',
      '--q-primary': '#101317',
      '--q-accent': '#FF7A18',
      '--q-text': '#F4F2EF',
      '--q-muted': '#8A8F98',
    })
    expect(themeFromClient(clientOrFail('norte'))).toEqual({
      '--q-bg': '#08090C',
      '--q-primary': '#12161C',
      '--q-accent': '#4DA3FF',
      '--q-text': '#F2F4F7',
      '--q-muted': '#868D99',
    })
  })
})
