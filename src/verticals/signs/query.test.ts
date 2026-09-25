import { describe, expect, it } from 'vitest'
import { defaultSelection, materialsForMode } from './config'
import type { PricingMode, SignSelection } from './types'
import { decodeQuoteParams, encodeQuoteParams } from './query'
import { signsClientOf, signsClientSlugs } from './testing'

const clientOrFail = signsClientOf

const northline = clientOrFail('northline')

function decodeOf(overrides: Record<string, string>, slug = 'northline'): SignSelection | null {
  const config = clientOrFail(slug)
  const params = new URLSearchParams(encodeQuoteParams(defaultSelection(config), 'area'))
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, value)
  }
  return decodeQuoteParams(config.options, params)
}

describe('encodeQuoteParams', () => {
  // 13.1
  it('devuelve las ocho claves en el orden t,x,w,h,m,l,i,q, con i en 0 o 1', () => {
    const selection = defaultSelection(northline)
    const keys = [...new URLSearchParams(encodeQuoteParams(selection, 'area')).keys()]
    expect(keys).toEqual(['t', 'x', 'w', 'h', 'm', 'l', 'i', 'q'])
    expect(encodeQuoteParams({ ...selection, installation: false }, 'area')).toContain('i=0')
    expect(encodeQuoteParams({ ...selection, installation: true }, 'area')).toContain('i=1')
  })

  // 13.1
  it('serializa los numeros con punto decimal sin importar el locale del cliente', () => {
    const norte = clientOrFail('norte')
    expect(encodeQuoteParams(defaultSelection(norte), 'area')).toContain('w=2.5')
  })
})

describe('decodeQuoteParams', () => {
  // 13.2
  // D127: cada cliente, con el primer tipo de cada modo que ofrece, elegido por su pricing y no
  // por posicion. Cada modo tiene que aparecer en al menos un cliente.
  it('ida y vuelta: devuelve la misma seleccion para cada cliente y cada modo que ofrece', () => {
    const modes: PricingMode[] = ['area', 'letters']
    const cubiertos = new Set<PricingMode>()
    for (const slug of signsClientSlugs()) {
      const config = clientOrFail(slug)
      for (const mode of modes) {
        const type = config.options.types.find((item) => item.pricing === mode)
        if (type === undefined) {
          continue
        }
        cubiertos.add(mode)
        const selection: SignSelection = {
          ...defaultSelection(config),
          type: type.id,
          materialId: materialsForMode(config.options, mode)[0].id,
        }
        const params = new URLSearchParams(encodeQuoteParams(selection, mode))
        expect(decodeQuoteParams(config.options, params), `${slug} ${mode}`).toEqual(selection)
      }
    }
    expect([...cubiertos].sort()).toEqual(['area', 'letters'])
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
    const params = new URLSearchParams(encodeQuoteParams(selection, 'area'))
    expect(decodeQuoteParams(northline.options, params)).toEqual(selection)
  })

  // 13.3
  it('devuelve null si falta cualquiera de las ocho claves, una por una', () => {
    for (const key of ['t', 'x', 'w', 'h', 'm', 'l', 'i', 'q']) {
      const params = new URLSearchParams(encodeQuoteParams(defaultSelection(northline), 'area'))
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

describe('quoteParams en modo letters', () => {
  function lettersOf(slug: string): SignSelection {
    return { ...defaultSelection(clientOrFail(slug)), type: 'letters', letterHeight: 1.5, depthId: 'd4' }
  }

  it('escribe t,x,lh,d,m,l,i,q y ni w ni h', () => {
    const keys = [...new URLSearchParams(encodeQuoteParams(lettersOf('northline'), 'letters')).keys()]
    expect(keys).toEqual(['t', 'x', 'lh', 'd', 'm', 'l', 'i', 'q'])
  })

  it('ida y vuelta: decodifica lh y d, y completa ancho y alto con el default que el motor ignora', () => {
    const selection = lettersOf('northline')
    const params = new URLSearchParams(encodeQuoteParams(selection, 'letters'))
    expect(decodeQuoteParams(northline.options, params)).toEqual(selection)
  })

  it('una clave del otro modo presente da null, en los dos sentidos', () => {
    const letters = new URLSearchParams(encodeQuoteParams(lettersOf('northline'), 'letters'))
    letters.set('w', '8')
    expect(decodeQuoteParams(northline.options, letters)).toBeNull()
    const area = new URLSearchParams(encodeQuoteParams(defaultSelection(northline), 'area'))
    area.set('d', 'd2')
    expect(decodeQuoteParams(northline.options, area)).toBeNull()
  })

  it('lh fuera de rango, lh faltante o d inexistente dan null', () => {
    const base = (): URLSearchParams => new URLSearchParams(encodeQuoteParams(lettersOf('northline'), 'letters'))
    const fuera = base()
    fuera.set('lh', '3.5')
    expect(decodeQuoteParams(northline.options, fuera)).toBeNull()
    const falta = base()
    falta.delete('lh')
    expect(decodeQuoteParams(northline.options, falta)).toBeNull()
    const sinDepth = base()
    sinDepth.set('d', 'd99')
    expect(decodeQuoteParams(northline.options, sinDepth)).toBeNull()
  })

  it('norte: lh viaja con punto decimal', () => {
    const norte = clientOrFail('norte')
    const selection = { ...defaultSelection(norte), type: 'letters', letterHeight: 0.45, depthId: 'd10' }
    const encoded = encodeQuoteParams(selection, 'letters')
    expect(encoded).toContain('lh=0.45')
    expect(decodeQuoteParams(norte.options, new URLSearchParams(encoded))).toEqual(selection)
  })
})
