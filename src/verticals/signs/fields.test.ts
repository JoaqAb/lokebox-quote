import { describe, expect, it } from 'vitest'
import { listClientSlugs } from '../../clients'
import northlineJson from '../../clients/northline.json'
import { defaultSelection, priceRulesFromClient } from './config'
import { calculateSignPrice } from './pricing/calculateSignPrice'
import type { SelectionValue } from '../../core/ui/panelTypes'
import { applyFieldChange, buildPanelFields, selectionFromValues, valuesFromSelection } from './fields'
import { signsClientOf, validateSignsJson } from './testing'

const clientOrFail = signsClientOf

function controlOf(slug: string, fieldId: string) {
  const field = buildPanelFields(clientOrFail(slug), defaultSelection(clientOrFail(slug))).find((item) => item.id === fieldId)
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

describe('buildPanelFields en modo area', () => {
  // 12.1
  it('devuelve los ocho campos en el orden de SPEC 5.2, con sus id y labelKey', () => {
    const fields = buildPanelFields(clientOrFail('northline'), defaultSelection(clientOrFail('northline')))
    expect(fields).toHaveLength(8)
    expect(fields.map((field) => field.id)).toEqual([
      'type',
      'text',
      'width',
      'height',
      'materialId',
      'lightingId',
      'installation',
      'quantity',
    ])
    expect(fields.map((field) => field.labelKey)).toEqual([
      'typeLabel',
      'signTextLabel',
      'widthLabel',
      'heightLabel',
      'materialLabel',
      'lightingLabel',
      'installationLabel',
      'quantityLabel',
    ])
  })

  // 12.2
  it('los kind son choice, text, range, range, choice, choice, boolean, stepper', () => {
    const fields = buildPanelFields(clientOrFail('northline'), defaultSelection(clientOrFail('northline')))
    expect(fields.map((field) => field.control.kind)).toEqual([
      'choice',
      'text',
      'range',
      'range',
      'choice',
      'choice',
      'boolean',
      'stepper',
    ])
  })

  // 12.3
  it('tipo tiene tres opciones, material tres e iluminacion tres', () => {
    expect(choiceLabels('northline', 'type')).toHaveLength(3)
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

describe('buildPanelFields por modo y applyFieldChange', () => {
  const config = clientOrFail('northline')

  it('en modo letters muestra alto de letra y profundidad, y no ancho ni alto', () => {
    const selection = { ...defaultSelection(config), type: 'letters' }
    const fields = buildPanelFields(config, selection)
    expect(fields.map((field) => field.id)).toEqual([
      'type',
      'text',
      'letterHeight',
      'depthId',
      'materialId',
      'lightingId',
      'installation',
      'quantity',
    ])
    expect(fields.find((field) => field.id === 'letterHeight')?.control).toEqual({
      kind: 'range',
      min: 0.5,
      max: 3,
      step: 0.25,
      unit: 'ft',
    })
    expect(fields.find((field) => field.id === 'depthId')?.labelKey).toBe('depthLabel')
  })

  it('en modo letters ofrece solo los materiales con pricePerLetterHeight', () => {
    const raw = structuredClone(northlineJson)
    delete (raw.options.materials[1] as Partial<(typeof raw.options.materials)[number]>).pricePerLetterHeight
    const partial = validateSignsJson(raw)
    const letters = buildPanelFields(partial, { ...defaultSelection(partial), type: 'letters' })
    const material = letters.find((field) => field.id === 'materialId')?.control
    expect(material?.kind === 'choice' ? material.choices.map((item) => item.id) : null).toEqual(['pvc', 'acrylic'])

    // Al pasar a letters con un material que no se ofrece, cae al primero que si.
    const values = { ...valuesFromSelection(defaultSelection(partial)), materialId: 'aluminum' }
    expect(applyFieldChange(partial, values, 'type', 'letters').materialId).toBe('pvc')
  })

  it('un texto sin letras no entra y el panel conserva el ultimo valido', () => {
    const values = valuesFromSelection(defaultSelection(config))
    expect(applyFieldChange(config, values, 'text', '')).toBe(values)
    expect(applyFieldChange(config, values, 'text', '   ')).toBe(values)
    expect(applyFieldChange(config, values, 'text', 'MI CAFE').text).toBe('MI CAFE')
  })

  it('cambiar de tipo en cualquier orden nunca deja un precio NaN ni una seleccion invalida', () => {
    for (const slug of ['northline', 'norte']) {
      const client = clientOrFail(slug)
      const rules = priceRulesFromClient(client)
      const ids = client.options.types.map((item) => item.id)
      const orders = ids.flatMap((a) => ids.flatMap((b) => ids.map((c) => [a, b, c])))
      for (const order of orders) {
        let values = valuesFromSelection(defaultSelection(client))
        for (const [index, typeId] of order.entries()) {
          values = applyFieldChange(client, values, 'type', typeId)
          values = applyFieldChange(client, values, 'materialId', client.options.materials[index % 3].id)
          const result = calculateSignPrice(rules, selectionFromValues(values))
          expect(Number.isFinite(result.total), `${slug} ${order.join('>')}`).toBe(true)
          expect(Number.isFinite(result.min) && Number.isFinite(result.max)).toBe(true)
        }
      }
    }
  })
})

describe('pasos del panel y swatch (version 2.8, D94)', () => {
  it('seis pasos seguidos: tipo, texto, medidas, material, iluminacion y cantidad, en los dos modos', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const type of ['facade', 'letters']) {
        const fields = buildPanelFields(config, { ...defaultSelection(config), type })
        const steps = fields.map((field) => field.step).filter((step, index, list) => list[index - 1] !== step)
        expect(steps).toEqual(['type', 'text', 'measures', 'material', 'lighting', 'quantity'])
        // Los pasos no se repiten: cada uno es un tramo seguido.
        expect(new Set(steps).size).toBe(steps.length)
      }
    }
  })

  it('el ultimo paso lleva el titulo de la cantidad y la instalacion va primero, como en SPEC 5.2', () => {
    const config = clientOrFail('northline')
    const last = buildPanelFields(config, defaultSelection(config)).filter((field) => field.step === 'quantity')
    expect(last.map((field) => field.id)).toEqual(['installation', 'quantity'])
    expect(last[0].stepTitleKey).toBe('quantityLabel')
  })

  it('los materiales llevan swatch con el color del JSON, y los demas choice no', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const fields = buildPanelFields(config, defaultSelection(config))
      for (const field of fields) {
        if (field.control.kind !== 'choice') {
          continue
        }
        for (const choice of field.control.choices) {
          if (field.id === 'materialId') {
            expect(choice.swatch).toBe(config.options.materials.find((item) => item.id === choice.id)?.visual.color)
          } else {
            expect(choice.swatch).toBeUndefined()
          }
        }
      }
    }
  })
})
