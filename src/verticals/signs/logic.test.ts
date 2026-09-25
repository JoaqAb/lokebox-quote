import { describe, expect, it } from 'vitest'
import { getClient } from '../../clients'
import { verticalContextOf } from '../../core/clientConfig'
import { defaultSelection } from './config'
import { signsLogic } from './logic'
import { signsConfigOf } from './testing'

// El contrato de SPEC 4.4 implementado por carteles (D133). Los detalles de cada parte estan en
// los tests de su archivo; aca va lo que agrega la logica al juntarlas.

describe('signsLogic', () => {
  it('validate lee la parte de carteles del JSON con el contexto del core', () => {
    const client = getClient('alba')
    if (client === null) {
      throw new Error('cliente no encontrado en el test: alba')
    }
    const config = signsLogic.validate(client.json, verticalContextOf(client))
    expect(config.display).toBe('hidden')
    expect(config.cta).toBe('both')
    expect(config.units).toEqual({ length: 'm', area: 'm2' })
    expect(config).toStrictEqual(signsConfigOf('alba'))
  })

  it('quantityOf es la cantidad de la seleccion', () => {
    const config = signsConfigOf('northline')
    expect(signsLogic.quantityOf({ ...defaultSelection(config), quantity: 7 })).toBe(7)
  })

  it('encodeQuery escribe solo las claves del modo del tipo elegido', () => {
    const config = signsConfigOf('northline')
    const selection = defaultSelection(config)
    expect(signsLogic.encodeQuery(config, selection)).toBe('t=facade&x=NORTHLINE&w=8&h=3&m=pvc&l=none&i=0&q=1')
    expect(signsLogic.encodeQuery(config, { ...selection, type: 'letters' })).toBe('t=letters&x=NORTHLINE&lh=1&d=d2&m=pvc&l=none&i=0&q=1')
    expect(signsLogic.decodeQuery(config, new URLSearchParams('t=facade&x=A'))).toBeNull()
  })

  it('lineDetail formatea las lineas de carteles y lanza con una linea ajena', () => {
    const config = signsConfigOf('northline')
    const result = signsLogic.price(config, defaultSelection(config))
    expect(signsLogic.lineDetail(config, result.lines[0])).toBe('24 sq ft x $15')
    expect(signsLogic.lineDetail(config, { id: 'x', labelKey: 'lineMaterial', detail: '', amount: 0 })).toBeNull()
    expect(() =>
      signsLogic.lineDetail(config, { id: 'discount', labelKey: 'lineDiscount', detail: '5%', amount: -1, detailValues: { id: 'discount', pct: 5 } }),
    ).toThrow(/"discount" no es de carteles/)
  })

  it('breakdownCaption es el area en modo area y no hay en modo letters', () => {
    const config = signsConfigOf('norte')
    const selection = defaultSelection(config)
    expect(signsLogic.breakdownCaption(config, signsLogic.price(config, selection))).toBe('2,5 m²')
    expect(signsLogic.breakdownCaption(config, signsLogic.price(config, { ...selection, type: 'letters' }))).toBeNull()
  })

  it('whatsappMessage en hidden no lleva cifras de precio', () => {
    const config = signsConfigOf('alba')
    const selection = defaultSelection(config)
    const message = signsLogic.whatsappMessage(config, selection, signsLogic.price(config, selection), 'hidden')
    expect(message).not.toMatch(/[{}]/)
    expect(message).not.toMatch(/\d\s?€/)
  })
})
