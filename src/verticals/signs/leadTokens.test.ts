import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection, priceRulesFromClient } from '../../core/clientConfig'
import { calculatePrice } from '../../core/pricing/calculatePrice'
import type { SignSelection } from '../../core/types'
import { signLeadSelection, signLeadTokens } from './leadTokens'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

function tokensOf(slug: string, patch: Partial<SignSelection> = {}) {
  const config = clientOrFail(slug)
  const selection: SignSelection = { ...defaultSelection(config), ...patch }
  const result = calculatePrice(priceRulesFromClient(config), selection)
  return signLeadTokens(config, selection, result)
}

describe('signLeadTokens', () => {
  // 11.14
  it('traduce ids a etiquetas del idioma del cliente, con su unidad y su moneda', () => {
    const en = tokensOf('northline', { installation: true })
    expect(en.type).toBe('Facade sign')
    expect(en.material).toBe('PVC')
    expect(en.lighting).toBe('None')
    expect(en.unit).toBe('ft')
    expect(en.installation).toBe(clientOrFail('northline').texts.installationYes)
    expect(en.min).toContain('$')
    expect(en.max).toContain('$')

    const es = tokensOf('norte', { installation: false, materialId: 'aluminum', lightingId: 'back' })
    expect(es.type).toBe('Cartel de fachada')
    expect(es.material).toBe('Chapa')
    expect(es.lighting).toBe('Retroiluminado')
    expect(es.unit).toBe('m')
    expect(es.installation).toBe(clientOrFail('norte').texts.installationNo)
    expect(es.min).toMatch(/\d/)

    // Las diez claves de SPEC 10, siempre presentes y no vacias.
    for (const slug of listClientSlugs()) {
      const tokens = tokensOf(slug)
      expect(Object.keys(tokens).sort()).toEqual([
        'height',
        'installation',
        'lighting',
        'material',
        'max',
        'min',
        'quantity',
        'type',
        'unit',
        'width',
      ])
      for (const value of Object.values(tokens)) {
        expect(value.length).toBeGreaterThan(0)
      }
    }
  })

  // 11.15
  it('ancho y alto salen sin decimales cuando son enteros y con uno cuando no', () => {
    expect(tokensOf('northline', { width: 8, height: 3 }).width).toBe('8')
    expect(tokensOf('northline', { width: 8.5, height: 3 }).width).toBe('8.5')
    expect(tokensOf('northline', { width: 8, height: 2.5 }).height).toBe('2.5')
    expect(tokensOf('norte', { width: 2.5, height: 1 }).height).toBe('1')
  })

  // 11.16
  it('lanza con un id de material que no existe, con el id en el mensaje', () => {
    expect(() => tokensOf('northline', { materialId: 'madera' })).toThrow(/madera/)
    expect(() => tokensOf('northline', { type: 'banner' })).toThrow(/banner/)
    expect(() => tokensOf('northline', { lightingId: 'neon' })).toThrow(/neon/)
  })
})

describe('signLeadSelection', () => {
  // 11.17
  it('lleva los siete campos de la seleccion, las tres etiquetas y la unidad', () => {
    const config = clientOrFail('norte')
    const selection = defaultSelection(config)
    const row = signLeadSelection(config, selection)
    expect(Object.keys(row).sort()).toEqual([
      'height',
      'installation',
      'lightingId',
      'lightingLabel',
      'materialId',
      'materialLabel',
      'quantity',
      'type',
      'typeLabel',
      'unit',
      'width',
    ])
    expect(row.type).toBe(selection.type)
    expect(row.typeLabel).toBe('Cartel de fachada')
    expect(row.materialId).toBe(selection.materialId)
    expect(row.materialLabel).toBe('PVC espumado')
    expect(row.lightingLabel).toBe('Sin luz')
    expect(row.unit).toBe('m')
    expect(row.installation).toBe(false)
    expect(row.quantity).toBe(selection.quantity)
  })
})
