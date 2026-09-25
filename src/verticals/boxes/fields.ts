import { formatInteger } from '../../core/pricing/format'
import type { PanelField, SelectionValue } from '../../core/ui/panelTypes'
import { materialsForStyle } from './config'
import type { BoxSelection, BoxTexts, BoxesConfig } from './types'

// Adaptador del panel de cajas (SPEC 21.1): cinco pasos, estilo, medidas interiores con el titulo
// dimensionsLabel, material con el swatch de su color, impresion y cantidad con un boton por
// escalon. Los ids de los campos son las claves de BoxSelection. Puro, sin React.

type BoxTextKey = Exclude<keyof BoxTexts, 'whatsappMessageHidden'>
type BoxPanelField = PanelField & { labelKey: BoxTextKey; stepTitleKey?: BoxTextKey }

export function buildPanelFields(config: BoxesConfig, selection: BoxSelection): BoxPanelField[] {
  const { options, units, locale } = config
  const range = (key: 'length' | 'width' | 'height') => ({
    kind: 'range' as const,
    min: options[key].min,
    max: options[key].max,
    step: options[key].step,
    unit: units.length,
  })
  return [
    {
      id: 'style',
      labelKey: 'styleLabel',
      step: 'style',
      control: { kind: 'choice', choices: options.styles.map((item) => ({ id: item.id, label: item.label })) },
    },
    { id: 'length', labelKey: 'lengthLabel', step: 'dimensions', stepTitleKey: 'dimensionsLabel', control: range('length') },
    { id: 'width', labelKey: 'widthLabel', step: 'dimensions', control: range('width') },
    { id: 'height', labelKey: 'heightLabel', step: 'dimensions', control: range('height') },
    {
      id: 'materialId',
      labelKey: 'materialLabel',
      step: 'material',
      control: {
        kind: 'choice',
        choices: materialsForStyle(options.materials, selection.style).map((item) => ({ id: item.id, label: item.label, swatch: item.visual.color })),
      },
    },
    {
      id: 'printingId',
      labelKey: 'printingLabel',
      step: 'printing',
      control: { kind: 'choice', choices: options.printing.map((item) => ({ id: item.id, label: item.label })) },
    },
    {
      id: 'quantity',
      labelKey: 'quantityLabel',
      step: 'quantity',
      control: {
        kind: 'choice',
        choices: options.quantities.map((tier) => ({ id: String(tier.qty), label: formatInteger(tier.qty, locale) })),
      },
    },
  ]
}

// La cantidad viaja al panel como el id de su boton, el qty en texto.
export function valuesFromSelection(selection: BoxSelection): Record<string, SelectionValue> {
  return {
    style: selection.style,
    length: selection.length,
    width: selection.width,
    height: selection.height,
    materialId: selection.materialId,
    printingId: selection.printingId,
    quantity: String(selection.quantity),
  }
}

function fail(key: string, expected: string, value: SelectionValue | undefined): never {
  throw new Error(`selectionFromValues: el campo "${key}" espera un ${expected} y llego: ${String(value)}`)
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

function readQuantity(values: Record<string, SelectionValue>): number {
  const text = readText(values, 'quantity')
  const value = Number(text)
  if (!Number.isInteger(value)) {
    fail('quantity', 'entero', text)
  }
  return value
}

export function selectionFromValues(values: Record<string, SelectionValue>): BoxSelection {
  return {
    style: readText(values, 'style'),
    length: readNumber(values, 'length'),
    width: readNumber(values, 'width'),
    height: readNumber(values, 'height'),
    materialId: readText(values, 'materialId'),
    printingId: readText(values, 'printingId'),
    quantity: readQuantity(values),
  }
}

// Al cambiar de estilo, si el material elegido no vale para el nuevo, pasa al primero que vale, en
// el orden del JSON (SPEC 21.1).
export function applyFieldChange(
  config: BoxesConfig,
  values: Record<string, SelectionValue>,
  fieldId: string,
  value: SelectionValue,
): Record<string, SelectionValue> {
  const next = { ...values, [fieldId]: value }
  if (fieldId === 'style' && typeof value === 'string') {
    const offered = materialsForStyle(config.options.materials, value)
    if (!offered.some((item) => item.id === next.materialId)) {
      next.materialId = offered[0].id
    }
  }
  return next
}
