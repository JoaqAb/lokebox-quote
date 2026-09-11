import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection, priceRulesFromClient } from '../clientConfig'
import type { SignSelection } from '../types'
import { calculatePrice } from './calculatePrice'
import { resolveLineLabel } from './lineLabels'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

// Seleccion que activa las cinco lineas del desglose: totem, con luz, con instalacion y cantidad 5.
function fullSelection(slug: string): SignSelection {
  const config = clientOrFail(slug)
  return {
    ...defaultSelection(config),
    type: 'totem',
    lightingId: 'back',
    installation: true,
    quantity: 5,
  }
}

describe('resolveLineLabel', () => {
  // 12.9
  it('resuelve cada labelKey del motor a un texto no vacio, para los dos clientes', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const result = calculatePrice(priceRulesFromClient(config), fullSelection(slug))
      expect(result.lines).toHaveLength(5)
      for (const line of result.lines) {
        const label = resolveLineLabel(line.labelKey, config.texts)
        expect(label.length).toBeGreaterThan(0)
      }
    }
  })

  // 12.10
  it('lanza con una clave que no existe en texts', () => {
    const config = clientOrFail('northline')
    expect(() => resolveLineLabel('lineNoExiste', config.texts)).toThrow(/lineNoExiste/)
  })
})
