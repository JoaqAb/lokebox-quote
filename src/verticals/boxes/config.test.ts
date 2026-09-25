import { describe, expect, it } from 'vitest'
import { BOX_TEXT_KEYS, defaultSelection, validateBoxes } from './config'
import { HIDDEN_TEXT, contextOf, rawOf, testConfigOf } from './testing'

// Validacion de la parte de cajas del JSON (SPEC 21.4): cada error nombra el slug y la clave.

type Raw = Record<string, any>

function failsWith(mutate: (raw: Raw) => void, pattern: RegExp, slug: 'foldline' | 'cajasur' = 'foldline'): void {
  const raw: Raw = rawOf(slug)
  mutate(raw)
  expect(() => validateBoxes(raw, contextOf(slug))).toThrow(new RegExp(`Cliente "${slug}": .*${pattern.source}`))
}

describe('validateBoxes', () => {
  it('los datos de SPEC 21.4 de los dos clientes validan', () => {
    expect(testConfigOf('foldline').units).toEqual({ length: 'in', area: 'sqft' })
    expect(testConfigOf('cajasur').units).toEqual({ length: 'cm', area: 'm2' })
    expect(testConfigOf('cajasur').options.styles.map((item) => item.assembly)).toEqual([170, 410, 70])
  })

  it('la seleccion default sale de defaults y del default de cada range', () => {
    expect(defaultSelection(testConfigOf('foldline'))).toEqual({
      style: 'mailer', length: 10, width: 8, height: 4, materialId: 'kraft', printingId: 'one', quantity: 250,
    })
    expect(defaultSelection(testConfigOf('cajasur'))).toEqual({
      style: 'shipping', length: 30, width: 20, height: 15, materialId: 'kraft', printingId: 'un-color', quantity: 100,
    })
  })

  it('un par de unidades invalido falla nombrando units', () => {
    failsWith((raw) => { raw.units = { length: 'in', area: 'm2' } }, /units/)
    failsWith((raw) => { raw.units = { length: 'cm', area: 'sqft' } }, /units/, 'cajasur')
    failsWith((raw) => { raw.units = { length: 'ft', area: 'sqft' } }, /units/)
  })

  it('escalones no crecientes o con el primer pct distinto de 0 fallan', () => {
    failsWith((raw) => { raw.options.quantities[2].qty = 100 }, /options\.quantities\[2\]/)
    failsWith((raw) => { raw.options.quantities[3].pct = 20 }, /options\.quantities\[3\]/)
    failsWith((raw) => { raw.options.quantities[0].pct = 5 }, /options\.quantities\[0\]\.pct/)
    failsWith((raw) => { raw.options.quantities[1].qty = 99.5 }, /options\.quantities\[1\]\.qty/)
  })

  it('un estilo sin material falla nombrando el estilo', () => {
    failsWith((raw) => {
      for (const material of raw.options.materials) {
        material.styles = ['two-piece']
      }
    }, /"mailer"/)
    failsWith((raw) => { raw.options.materials[2].styles = ['box'] }, /options\.materials\[2\]\.styles\[0\]/)
  })

  it('un default incoherente falla nombrando la clave de defaults', () => {
    failsWith((raw) => { raw.options.defaults.materialId = 'rigid' }, /options\.defaults\.materialId/)
    failsWith((raw) => { raw.options.defaults.style = 'bag' }, /options\.defaults\.style/)
    failsWith((raw) => { raw.options.defaults.printingId = 'gold' }, /options\.defaults\.printingId/)
    failsWith((raw) => { raw.options.defaults.quantity = 300 }, /options\.defaults\.quantity/)
  })

  it('lidDepth ausente o fuera de rango en two-piece falla', () => {
    failsWith((raw) => { delete raw.options.styles[1].visual.lidDepth }, /options\.styles\[1\]\.visual\.lidDepth/)
    failsWith((raw) => { raw.options.styles[1].visual.lidDepth = 0 }, /options\.styles\[1\]\.visual\.lidDepth/)
  })

  it('thicknessMm ausente o no positivo falla', () => {
    failsWith((raw) => { delete raw.options.materials[0].visual.thicknessMm }, /options\.materials\[0\]\.visual\.thicknessMm/)
    failsWith((raw) => { raw.options.materials[1].visual.thicknessMm = 0 }, /options\.materials\[1\]\.visual\.thicknessMm/)
    failsWith((raw) => { raw.options.materials[1].visual.thicknessMm = -2 }, /options\.materials\[1\]\.visual\.thicknessMm/)
  })

  it('cada una de las 17 claves de texts es obligatoria', () => {
    expect(BOX_TEXT_KEYS).toHaveLength(17)
    for (const key of BOX_TEXT_KEYS) {
      failsWith((raw) => { delete raw.texts[key] }, new RegExp(`"${key}"`))
    }
  })

  it('whatsappMessageHidden se exige solo con hidden y un CTA con WhatsApp', () => {
    for (const cta of ['whatsapp', 'both'] as const) {
      expect(() => validateBoxes(rawOf('foldline'), contextOf('foldline', { cta, display: 'hidden' }))).toThrow(
        /Cliente "foldline": .*"whatsappMessageHidden"/,
      )
    }
    expect(() => validateBoxes(rawOf('foldline'), contextOf('foldline', { cta: 'form', display: 'hidden' }))).not.toThrow()
    const raw: Raw = rawOf('foldline')
    raw.texts.whatsappMessageHidden = HIDDEN_TEXT
    expect(validateBoxes(raw, contextOf('foldline', { display: 'hidden' })).texts.whatsappMessageHidden).toBe(HIDDEN_TEXT)
  })

  it('shape, logo, precios negativos y photos fallan nombrando la clave', () => {
    failsWith((raw) => { raw.options.styles[0].visual.shape = 'tube' }, /options\.styles\[0\]\.visual\.shape/)
    failsWith((raw) => { raw.options.printing[1].visual.logo = 'gold' }, /options\.printing\[1\]\.visual\.logo/)
    failsWith((raw) => { raw.options.styles[0].assembly = -1 }, /options\.styles\[0\]\.assembly/)
    failsWith((raw) => { raw.options.printing[2].setup = -5 }, /options\.printing\[2\]\.setup/)
    failsWith((raw) => { raw.photos = [] }, /photos/)
  })
})
