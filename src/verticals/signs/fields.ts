import type { PanelField, SelectionValue } from '../../core/ui/panelTypes'
import { countLetters } from '../../core/pricing/calculatePrice'
import { materialsForMode, pricingModeOf } from '../../core/clientConfig'
import type { ClientConfig, SignSelection } from '../../core/types'

// Adaptador de la vertical carteleria. Arma los descriptores del panel desde el JSON
// del cliente y traduce entre la seleccion del dominio y los valores del panel.
// Los ids de los campos son las claves de SignSelection, asi los dos adaptadores son directos.
// Los descriptores dependen del tipo elegido (SPEC 4.2): el modo area muestra ancho y
// alto, el modo letters alto de letra y profundidad, y solo los materiales con precio
// por letra. Todas las funciones son puras, sin React.

const STEPPER_STEP = 1

function labeledChoices(list: { id: string; label: string }[]): { id: string; label: string }[] {
  return list.map((item) => ({ id: item.id, label: item.label }))
}

export function buildPanelFields(config: ClientConfig, selection: SignSelection): PanelField[] {
  const { options, texts, units } = config
  const mode = pricingModeOf(options, selection.type)
  const measures: PanelField[] =
    mode === 'area'
      ? [
          {
            id: 'width',
            labelKey: 'widthLabel',
            control: {
              kind: 'range',
              min: options.width.min,
              max: options.width.max,
              step: options.width.step,
              unit: units.length,
            },
          },
          {
            id: 'height',
            labelKey: 'heightLabel',
            control: {
              kind: 'range',
              min: options.height.min,
              max: options.height.max,
              step: options.height.step,
              unit: units.length,
            },
          },
        ]
      : [
          {
            id: 'letterHeight',
            labelKey: 'letterHeightLabel',
            control: {
              kind: 'range',
              min: options.letterHeight.min,
              max: options.letterHeight.max,
              step: options.letterHeight.step,
              unit: units.length,
            },
          },
          {
            id: 'depthId',
            labelKey: 'depthLabel',
            control: { kind: 'choice', choices: labeledChoices(options.depths) },
          },
        ]
  return [
    {
      id: 'type',
      labelKey: 'typeLabel',
      control: { kind: 'choice', choices: labeledChoices(options.types) },
    },
    {
      id: 'text',
      labelKey: 'signTextLabel',
      control: { kind: 'text', maxLength: options.signText.maxLength },
    },
    ...measures,
    {
      id: 'materialId',
      labelKey: 'materialLabel',
      control: { kind: 'choice', choices: labeledChoices(materialsForMode(options, mode)) },
    },
    {
      id: 'lightingId',
      labelKey: 'lightingLabel',
      control: { kind: 'choice', choices: labeledChoices(options.lighting) },
    },
    {
      id: 'installation',
      labelKey: 'installationLabel',
      control: {
        kind: 'boolean',
        trueLabel: texts.installationYes,
        falseLabel: texts.installationNo,
      },
    },
    {
      id: 'quantity',
      labelKey: 'quantityLabel',
      control: {
        kind: 'stepper',
        min: options.quantity.min,
        max: options.quantity.max,
        step: STEPPER_STEP,
      },
    },
  ]
}

export function valuesFromSelection(selection: SignSelection): Record<string, SelectionValue> {
  return {
    type: selection.type,
    text: selection.text,
    width: selection.width,
    height: selection.height,
    letterHeight: selection.letterHeight,
    depthId: selection.depthId,
    materialId: selection.materialId,
    lightingId: selection.lightingId,
    installation: selection.installation,
    quantity: selection.quantity,
  }
}

function fail(key: string, expected: string, value: SelectionValue | undefined): never {
  throw new Error(
    `selectionFromValues: el campo "${key}" espera un ${expected} y llego: ${String(value)}`,
  )
}

function readText(values: Record<string, SelectionValue>, key: string): string {
  const value = values[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(key, 'string no vacio', value)
  }
  return value
}

function readNumber(values: Record<string, SelectionValue>, key: string): number {
  const value = values[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(key, 'numero', value)
  }
  return value
}

function readFlag(values: Record<string, SelectionValue>, key: string): boolean {
  const value = values[key]
  if (typeof value !== 'boolean') {
    fail(key, 'booleano', value)
  }
  return value
}

export function selectionFromValues(values: Record<string, SelectionValue>): SignSelection {
  return {
    type: readText(values, 'type'),
    text: readText(values, 'text'),
    width: readNumber(values, 'width'),
    height: readNumber(values, 'height'),
    letterHeight: readNumber(values, 'letterHeight'),
    depthId: readText(values, 'depthId'),
    materialId: readText(values, 'materialId'),
    lightingId: readText(values, 'lightingId'),
    installation: readFlag(values, 'installation'),
    quantity: readNumber(values, 'quantity'),
  }
}

// Aplica un cambio del panel sin dejar nunca un estado que el motor rechace.
// - Un texto sin ninguna letra no entra: vacio es invalido (TAREA_009) y en modo letters
//   cero letras no se cotiza. El campo conserva el ultimo texto valido.
// - Al cambiar de tipo, si el material elegido no se ofrece en el modo nuevo, pasa al
//   primero que si. Con los dos clientes de la demo no ocurre, pero el JSON lo permite.
export function applyFieldChange(
  config: ClientConfig,
  values: Record<string, SelectionValue>,
  fieldId: string,
  value: SelectionValue,
): Record<string, SelectionValue> {
  if (fieldId === 'text' && (typeof value !== 'string' || countLetters(value) === 0)) {
    return values
  }
  const next = { ...values, [fieldId]: value }
  if (fieldId === 'type' && typeof value === 'string') {
    const offered = materialsForMode(config.options, pricingModeOf(config.options, value))
    if (!offered.some((item) => item.id === next.materialId)) {
      next.materialId = offered[0].id
    }
  }
  return next
}
