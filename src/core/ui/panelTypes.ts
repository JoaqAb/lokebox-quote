import type { ClientTexts } from '../types'

// Descriptores del panel de opciones. El core renderiza estos descriptores y nada mas:
// no sabe que existen materiales, iluminacion ni carteles. La vertical los arma.

export type SelectionValue = string | number | boolean

export type FieldControl =
  | { kind: 'choice'; choices: { id: string; label: string }[] }
  | { kind: 'range'; min: number; max: number; step: number; unit: string }
  | { kind: 'boolean'; trueLabel: string; falseLabel: string }
  | { kind: 'stepper'; min: number; max: number; step: number }

export type PanelField = {
  id: string
  labelKey: keyof ClientTexts
  control: FieldControl
}
