import { describe, expect, it } from 'vitest'
import { getClient } from '../../clients'
import { verticalContextOf } from '../../core/clientConfig'
import { validateBoxes } from './config'
import { CAJASUR_BOXES, FOLDLINE_BOXES } from './testing'

// Los dos JSON de cajas contra SPEC 21.4 (D125): las unidades y las opciones son exactamente las de
// testing.ts, contra las que se prueba la logica, y el resto de la forma es la de D125.

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('clientes de cajas', () => {
  for (const [slug, boxes] of [['foldline', FOLDLINE_BOXES], ['cajasur', CAJASUR_BOXES]] as const) {
    it(`${slug} trae las unidades y las opciones de SPEC 21.4 y valida`, () => {
      const client = clientOrFail(slug)
      expect(client.json.units).toEqual(boxes.units)
      expect(client.json.options).toEqual(boxes.options)
      expect(client.json.photos).toBeUndefined()
      expect(() => validateBoxes(client.json, verticalContextOf(client))).not.toThrow()
    })
  }

  it('foldline en USD con 2 decimales, range y both; cajasur en ARS con 0, range y whatsapp', () => {
    const foldline = clientOrFail('foldline')
    expect([foldline.locale, foldline.currency.code, foldline.currency.decimals, foldline.cta, foldline.prices_placeholder]).toEqual(['en', 'USD', 2, 'both', false])
    expect(foldline.pricing).toBeUndefined()
    const cajasur = clientOrFail('cajasur')
    expect([cajasur.locale, cajasur.currency.code, cajasur.currency.decimals, cajasur.cta, cajasur.prices_placeholder]).toEqual(['es-AR', 'ARS', 0, 'whatsapp', true])
    expect(cajasur.pricing).toBeUndefined()
  })
})
