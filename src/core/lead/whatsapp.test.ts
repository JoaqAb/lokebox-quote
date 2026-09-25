import { describe, expect, it } from 'vitest'
import { buildWhatsappMessage, whatsappLink } from './whatsapp'

const TOKENS: Record<string, string> = {
  type: 'Panel',
  width: '8',
  height: '3',
  unit: 'ft',
  material: 'PVC',
  lighting: 'None',
  installation: 'No, I install it',
  quantity: '1',
  min: '$331',
  max: '$389',
}

describe('buildWhatsappMessage', () => {
  // 11.8, la parte generica. El caso con la plantilla real de un cliente esta en
  // src/verticals/signs/leadTokens.test.ts: el core no importa de src/clients.
  it('reemplaza los placeholders repetidos tambien', () => {
    const repetido = buildWhatsappMessage('{unit} y {unit}', TOKENS)
    expect(repetido).toBe('ft y ft')
  })

  // 11.9
  it('lanza si un placeholder no tiene token, con la clave en el mensaje', () => {
    expect(() => buildWhatsappMessage('hola {colores}', TOKENS)).toThrow(/colores/)
  })
})

describe('whatsappLink', () => {
  // 11.10
  it('codifica el mensaje y deja el numero en digitos', () => {
    const link = whatsappLink('+54 9 381 555-1234', 'hola mundo & cia')
    expect(link).toBe('https://wa.me/5493815551234?text=hola%20mundo%20%26%20cia')
  })
})
