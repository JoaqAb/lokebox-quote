import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection, priceRulesFromClient } from '../../core/clientConfig'
import { buildWhatsappMessage } from '../../core/lead/whatsapp'
import { calculatePrice } from '../../core/pricing/calculatePrice'
import { formatCurrency } from '../../core/pricing/format'
import type { SignSelection } from '../../core/types'
import { signLeadSelection, signLeadTokens, signWhatsappTemplate } from './leadTokens'
import { signQuoteRows } from './quoteRows'

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

  // 11.15 (editada en TAREA_006: las medidas pasan a formatLength con el locale del
  // cliente, asi el mensaje de norte dice "2,5 x 1 m" con coma. Los enteros siguen sin
  // decimales y ahora se admiten dos, no uno.)
  it('ancho y alto usan el separador decimal del locale del cliente', () => {
    expect(tokensOf('northline', { width: 8, height: 3 }).width).toBe('8')
    expect(tokensOf('northline', { width: 8.5, height: 3 }).width).toBe('8.5')
    expect(tokensOf('northline', { width: 8, height: 2.5 }).height).toBe('2.5')
    expect(tokensOf('norte', { width: 2.5, height: 1 }).width).toBe('2,5')
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

describe('WhatsApp y hoja en modo letters', () => {
  for (const slug of ['northline', 'norte']) {
    it(`${slug}: el mensaje de letters sale completo, sin placeholders ni huecos`, () => {
      const config = clientOrFail(slug)
      const selection = { ...defaultSelection(config), type: 'letters', text: 'MI CAFÉ', installation: true }
      const result = calculatePrice(priceRulesFromClient(config), selection)
      const template = signWhatsappTemplate(config, selection)
      expect(template).toBe(config.texts.whatsappMessageLetters)
      const message = buildWhatsappMessage(template, signLeadTokens(config, selection, result))
      expect(message).not.toMatch(/[{}]/)
      expect(message).not.toMatch(/ ,|,,|\s{2}|undefined|NaN/)
      expect(message).toContain('MI CAFÉ')
      expect(message).toContain(' 6 ')
      expect(message).toContain(config.options.depths[0].label)
      expect(message).toContain(formatCurrency(result.max, config.currency, config.locale))
    })
  }

  it('en modo area la plantilla sigue siendo whatsappMessage', () => {
    const config = clientOrFail('norte')
    expect(signWhatsappTemplate(config, defaultSelection(config))).toBe(config.texts.whatsappMessage)
  })

  it('norte: el alto de letra va con coma decimal y la unidad del cliente', () => {
    const config = clientOrFail('norte')
    const selection = { ...defaultSelection(config), type: 'letters', letterHeight: 0.45 }
    const tokens = signLeadTokens(config, selection, calculatePrice(priceRulesFromClient(config), selection))
    expect(tokens.letterHeight).toBe('0,45')
    expect(tokens.unit).toBe('m')
    expect(tokens.letters).toBe('5')
  })

  it('la columna selection del lead lleva texto, letras, alto y profundidad en vez de ancho y alto', () => {
    const config = clientOrFail('northline')
    const selection = { ...defaultSelection(config), type: 'letters', depthId: 'd6' }
    const row = signLeadSelection(config, selection)
    expect(row).toMatchObject({ text: 'NORTHLINE', letters: 9, letterHeight: 1, depthId: 'd6', depthLabel: '6 in' })
    expect(row).not.toHaveProperty('width')
  })

  it('las filas de la hoja en modo letters muestran texto, alto de letra y profundidad', () => {
    const config = clientOrFail('norte')
    const selection = { ...defaultSelection(config), type: 'letters', depthId: 'd15' }
    expect(signQuoteRows(config, selection).map((row) => [row.label, row.value])).toEqual([
      ['Tipo de cartel', 'Letras corpóreas'],
      ['Texto del cartel', 'NORTE'],
      ['Alto de letra', '0,3 m'],
      ['Profundidad', '15 cm'],
      ['Material', 'PVC espumado'],
      ['Iluminación', 'Sin luz'],
      ['Instalación', 'No, lo instalo yo'],
      ['Cantidad', '1'],
    ])
  })
})
