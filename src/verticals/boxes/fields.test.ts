import { describe, expect, it } from 'vitest'
import { defaultSelection } from './config'
import { applyFieldChange, buildPanelFields, selectionFromValues, valuesFromSelection } from './fields'
import { testConfigOf } from './testing'

describe('panel de cajas (SPEC 21.1)', () => {
  it('cinco pasos: estilo, medidas con dimensionsLabel, material con swatch, impresion y cantidad con Intl', () => {
    const config = testConfigOf('cajasur')
    const fields = buildPanelFields(config, defaultSelection(config))
    expect([...new Set(fields.map((field) => field.step))]).toEqual(['style', 'dimensions', 'material', 'printing', 'quantity'])
    expect(fields.find((field) => field.id === 'length')?.stepTitleKey).toBe('dimensionsLabel')
    const length = fields.find((field) => field.id === 'length')?.control
    expect(length).toEqual({ kind: 'range', min: 10, max: 60, step: 1, unit: 'cm' })
    const material = fields.find((field) => field.id === 'materialId')?.control
    // Envio: el rigido no se ofrece.
    expect(material).toEqual({
      kind: 'choice',
      choices: [
        { id: 'kraft', label: 'Kraft corrugado', swatch: '#B8895A' },
        { id: 'blanco', label: 'Blanco corrugado', swatch: '#ECEAE4' },
      ],
    })
    const quantity = fields.find((field) => field.id === 'quantity')?.control
    expect(quantity).toEqual({
      kind: 'choice',
      choices: [
        { id: '50', label: '50' },
        { id: '100', label: '100' },
        { id: '250', label: '250' },
        { id: '500', label: '500' },
        { id: '1000', label: '1.000' },
      ],
    })
    const en = testConfigOf('foldline')
    const enQuantity = buildPanelFields(en, defaultSelection(en)).find((field) => field.id === 'quantity')?.control
    expect(enQuantity?.kind === 'choice' ? enQuantity.choices.at(-1) : null).toEqual({ id: '1000', label: '1,000' })
  })

  it('valores y seleccion van y vuelven iguales', () => {
    const config = testConfigOf('foldline')
    const selection = defaultSelection(config)
    expect(selectionFromValues(valuesFromSelection(selection))).toEqual(selection)
    expect(() => selectionFromValues({ ...valuesFromSelection(selection), quantity: 'mucho' })).toThrow(/quantity/)
  })

  it('de two-piece con rigido a mailer, el material pasa al primero que vale', () => {
    const config = testConfigOf('foldline')
    const values = { ...valuesFromSelection(defaultSelection(config)), style: 'two-piece', materialId: 'rigid' }
    expect(applyFieldChange(config, values, 'style', 'mailer').materialId).toBe('kraft')
    const white = { ...values, materialId: 'white' }
    expect(applyFieldChange(config, white, 'style', 'mailer').materialId).toBe('white')
  })
})
