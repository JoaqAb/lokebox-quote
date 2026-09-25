import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../../clients'
import { resolveTextKey } from '../../../core/textKeys'
import { TOTEM_TYPE_ID, defaultSelection, materialsForMode, priceRulesFromClient } from '../config'
import { signsConfigOf } from '../testing'
import type { SignSelection } from '../types'
import { calculateSignPrice } from './calculateSignPrice'

// Hasta la version 2.12 era src/core/pricing/lineLabels.test.ts, sobre resolveLineLabel. Desde 2.13
// el core resuelve cualquier clave de texto con resolveTextKey, contra el texts del cliente.

const clientOrFail = signsConfigOf

// El texts del cliente, el que recibe el core.
function clientTexts(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client.texts
}

// Seleccion que activa las cinco lineas del desglose: totem, con luz, con instalacion y cantidad 5.
// La luz es la ultima del cliente, que en todos es una luz con precio.
function fullSelection(slug: string): SignSelection {
  const config = clientOrFail(slug)
  return {
    ...defaultSelection(config),
    type: TOTEM_TYPE_ID,
    materialId: materialsForMode(config.options, 'area')[0].id,
    lightingId: config.options.lighting[config.options.lighting.length - 1].id,
    installation: true,
    quantity: 5,
  }
}

describe('resolveTextKey con las lineas de carteles', () => {
  // 12.9
  // D127: corre sobre cada cliente con totem, el tipo que suma la linea de estructura, y exige que
  // haya al menos uno.
  it('resuelve cada labelKey del motor a un texto no vacio, para cada cliente con totem', () => {
    const conTotem = listClientSlugs().filter((slug) =>
      clientOrFail(slug).options.types.some((item) => item.id === TOTEM_TYPE_ID),
    )
    expect(conTotem.length).toBeGreaterThan(0)
    for (const slug of conTotem) {
      const config = clientOrFail(slug)
      const result = calculateSignPrice(priceRulesFromClient(config), fullSelection(slug))
      expect(result.lines).toHaveLength(5)
      for (const line of result.lines) {
        const label = resolveTextKey(line.labelKey, clientTexts(slug))
        expect(label.length).toBeGreaterThan(0)
      }
    }
  })

  // 12.10
  it('lanza con una clave que no existe en texts', () => {
    expect(() => resolveTextKey('lineNoExiste', clientTexts('northline'))).toThrow(/lineNoExiste/)
  })
})

describe('lineas del desglose segun la cantidad', () => {
  // 13.15
  it('con cantidad 1 no hay linea de descuento y con cantidad 5 el descuento es negativo', () => {
    const config = clientOrFail('northline')
    const rules = priceRulesFromClient(config)

    const sinDescuento = calculateSignPrice(rules, { ...fullSelection('northline'), quantity: 1 })
    expect(sinDescuento.lines.some((line) => line.id === 'discount')).toBe(false)

    const conDescuento = calculateSignPrice(rules, fullSelection('northline'))
    expect(conDescuento.lines).toHaveLength(5)
    const descuento = conDescuento.lines.find((line) => line.id === 'discount')
    expect(descuento?.amount).toBeLessThan(0)
  })
})
