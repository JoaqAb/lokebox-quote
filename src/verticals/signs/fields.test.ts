import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection } from '../../core/clientConfig'
import type { SelectionValue } from '../../core/ui/panelTypes'
import { selectionFromValues, signFields, valuesFromSelection } from './fields'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

function controlOf(slug: string, fieldId: string) {
  const field = signFields(clientOrFail(slug)).find((item) => item.id === fieldId)
  if (field === undefined) {
    throw new Error(`campo no encontrado en el test: ${fieldId}`)
  }
  return field.control
}

function choiceLabels(slug: string, fieldId: string): string[] {
  const control = controlOf(slug, fieldId)
  if (control.kind !== 'choice') {
    throw new Error(`el campo ${fieldId} no es un choice`)
  }
  return control.choices.map((choice) => choice.label)
}

describe('signFields', () => {
  // 12.1
  it('devuelve los siete campos en el orden de SPEC 5.2, con sus id y labelKey', () => {
    const fields = signFields(clientOrFail('northline'))
    expect(fields).toHaveLength(7)
    expect(fields.map((field) => field.id)).toEqual([
      'type',
      'width',
      'height',
      'materialId',
      'lightingId',
      'installation',
      'quantity',
    ])
    expect(fields.map((field) => field.labelKey)).toEqual([
      'typeLabel',
      'widthLabel',
      'heightLabel',
      'materialLabel',
      'lightingLabel',
      'installationLabel',
      'quantityLabel',
    ])
  })

  // 12.2
  it('los kind son choice, range, range, choice, choice, boolean, stepper', () => {
    const fields = signFields(clientOrFail('northline'))
    expect(fields.map((field) => field.control.kind)).toEqual([
      'choice',
      'range',
      'range',
      'choice',
      'choice',
      'boolean',
      'stepper',
    ])
  })

  // 12.3
  it('tipo tiene dos opciones, material tres e iluminacion tres', () => {
    expect(choiceLabels('northline', 'type')).toHaveLength(2)
    expect(choiceLabels('northline', 'materialId')).toHaveLength(3)
    expect(choiceLabels('northline', 'lightingId')).toHaveLength(3)
  })

  // 12.4
  it('el slider de ancho toma min, max, step y unidad del JSON de cada cliente', () => {
    expect(controlOf('northline', 'width')).toEqual({
      kind: 'range',
      min: 2,
      max: 20,
      step: 0.5,
      unit: 'ft',
    })
    expect(controlOf('norte', 'width')).toEqual({
      kind: 'range',
      min: 0.6,
      max: 6,
      step: 0.1,
      unit: 'm',
    })
  })

  // 12.5
  it('las etiquetas de material salen del JSON: ingles en northline y espanol en norte', () => {
    expect(choiceLabels('northline', 'materialId')).toEqual(['PVC', 'Aluminum', 'Acrylic'])
    expect(choiceLabels('norte', 'materialId')).toEqual(['PVC espumado', 'Chapa', 'Acrílico'])
  })
})

describe('valuesFromSelection y selectionFromValues', () => {
  // 12.6
  it('ida y vuelta devuelve la misma seleccion, para los dos clientes', () => {
    for (const slug of listClientSlugs()) {
      const selection = defaultSelection(clientOrFail(slug))
      expect(selectionFromValues(valuesFromSelection(selection))).toEqual(selection)
    }
  })

  // 12.7
  it('lanza si falta un campo o si llega con el tipo equivocado', () => {
    const values = valuesFromSelection(defaultSelection(clientOrFail('northline')))

    const sinQuantity: Record<string, SelectionValue> = { ...values }
    delete sinQuantity.quantity
    expect(() => selectionFromValues(sinQuantity)).toThrow(/quantity/)

    const anchoTexto: Record<string, SelectionValue> = { ...values, width: '8' }
    expect(() => selectionFromValues(anchoTexto)).toThrow(/width/)
  })
})
