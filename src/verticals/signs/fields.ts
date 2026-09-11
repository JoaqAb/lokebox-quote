import type { PanelField, SelectionValue } from '../../core/ui/panelTypes'
import type { ClientConfig, SignSelection } from '../../core/types'

// Adaptador de la vertical carteleria. Arma los descriptores del panel desde el JSON
// del cliente y traduce entre la seleccion del dominio y los valores del panel.
// Los ids de los campos son las claves de SignSelection, asi los dos adaptadores son directos.
// Las tres funciones son puras, sin React.

const STEPPER_STEP = 1

function labeledChoices(list: { id: string; label: string }[]): { id: string; label: string }[] {
  return list.map((item) => ({ id: item.id, label: item.label }))
}

export function signFields(config: ClientConfig): PanelField[] {
  const { options, texts, units } = config
  return [
    {
      id: 'type',
      labelKey: 'typeLabel',
      control: { kind: 'choice', choices: labeledChoices(options.types) },
    },
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
    {
      id: 'materialId',
      labelKey: 'materialLabel',
      control: { kind: 'choice', choices: labeledChoices(options.materials) },
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
    width: selection.width,
    height: selection.height,
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
    width: readNumber(values, 'width'),
    height: readNumber(values, 'height'),
    materialId: readText(values, 'materialId'),
    lightingId: readText(values, 'lightingId'),
    installation: readFlag(values, 'installation'),
    quantity: readNumber(values, 'quantity'),
  }
}
