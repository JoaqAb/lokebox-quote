import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection } from '../clientConfig'
import type { ClientConfig, SignSelection } from '../types'
import { decodeQuoteParams, encodeQuoteParams } from './quoteParams'

function clientOrFail(slug: string): ClientConfig {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

const northline = clientOrFail('northline')

function decodeOf(overrides: Record<string, string>, slug = 'northline'): SignSelection | null {
  const config = clientOrFail(slug)
  const params = new URLSearchParams(encodeQuoteParams(defaultSelection(config)))
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, value)
  }
  return decodeQuoteParams(config.options, params)
}

describe('encodeQuoteParams', () => {
  // 13.1
  it('devuelve las siete claves en el orden t,w,h,m,l,i,q, con i en 0 o 1', () => {
    const selection = defaultSelection(northline)
    const keys = [...new URLSearchParams(encodeQuoteParams(selection)).keys()]
    expect(keys).toEqual(['t', 'w', 'h', 'm', 'l', 'i', 'q'])
    expect(encodeQuoteParams({ ...selection, installation: false })).toContain('i=0')
    expect(encodeQuoteParams({ ...selection, installation: true })).toContain('i=1')
  })

  // 13.1
  it('serializa los numeros con punto decimal sin importar el locale del cliente', () => {
    const norte = clientOrFail('norte')
    expect(encodeQuoteParams(defaultSelection(norte))).toContain('w=2.5')
  })
})

describe('decodeQuoteParams', () => {
  // 13.2
  it('ida y vuelta: devuelve la misma seleccion para los dos clientes', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const selection = defaultSelection(config)
      const params = new URLSearchParams(encodeQuoteParams(selection))
      expect(decodeQuoteParams(config.options, params)).toEqual(selection)
    }
  })

  // 13.2
  it('ida y vuelta con una seleccion con decimales', () => {
    const selection: SignSelection = {
      ...defaultSelection(northline),
      width: 8.5,
      height: 2.5,
      installation: true,
      quantity: 4,
    }
    const params = new URLSearchParams(encodeQuoteParams(selection))
    expect(decodeQuoteParams(northline.options, params)).toEqual(selection)
  })

  // 13.3
  it('devuelve null si falta cualquiera de las siete claves, una por una', () => {
    for (const key of ['t', 'w', 'h', 'm', 'l', 'i', 'q']) {
      const params = new URLSearchParams(encodeQuoteParams(defaultSelection(northline)))
      params.delete(key)
      expect(decodeQuoteParams(northline.options, params)).toBeNull()
    }
  })

  // 13.4
  it('devuelve null con un id de tipo, material o iluminacion que no existe', () => {
    expect(decodeOf({ t: 'banner' })).toBeNull()
    expect(decodeOf({ m: 'madera' })).toBeNull()
    expect(decodeOf({ l: 'neon' })).toBeNull()
  })

  // 13.5
  it('devuelve null con w o h fuera de rango, no numerico, vacio o NaN', () => {
    for (const key of ['w', 'h']) {
      expect(decodeOf({ [key]: '0' })).toBeNull()
      expect(decodeOf({ [key]: '999' })).toBeNull()
      expect(decodeOf({ [key]: 'ancho' })).toBeNull()
      expect(decodeOf({ [key]: '' })).toBeNull()
      expect(decodeOf({ [key]: 'NaN' })).toBeNull()
      expect(decodeOf({ [key]: 'Infinity' })).toBeNull()
    }
  })

  // 13.6
  it('acepta w y h exactamente en min y en max', () => {
    const { width, height } = northline.options
    expect(decodeOf({ w: String(width.min), h: String(height.min) })).not.toBeNull()
    expect(decodeOf({ w: String(width.max), h: String(height.max) })).not.toBeNull()
  })

  // 13.7
  it('devuelve null con q en 0, en max + 1 o con decimales, y con i que no sea 0 ni 1', () => {
    expect(decodeOf({ q: '0' })).toBeNull()
    expect(decodeOf({ q: String(northline.options.quantity.max + 1) })).toBeNull()
    expect(decodeOf({ q: '2.5' })).toBeNull()
    expect(decodeOf({ i: '2' })).toBeNull()
    expect(decodeOf({ i: 'true' })).toBeNull()
  })

  // 13.8
  it('acepta un ancho entre dos pasos del slider y lo devuelve tal cual', () => {
    expect(decodeOf({ w: '8.3' })?.width).toBe(8.3)
  })
})
