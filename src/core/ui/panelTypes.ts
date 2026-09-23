import type { RequiredTextKey } from '../types'

// Descriptores del panel de opciones. El core renderiza estos descriptores y nada mas:
// no sabe que existen materiales, iluminacion ni carteles. La vertical los arma.

export type SelectionValue = string | number | boolean

// Una opcion de un grupo. swatch (version 2.8, D94): un color opcional que se muestra junto a la
// etiqueta. Lo completa la vertical; el core solo lo pinta.
export type Choice = { id: string; label: string; swatch?: string }

export type FieldControl =
  | { kind: 'choice'; choices: Choice[] }
  | { kind: 'range'; min: number; max: number; step: number; unit: string }
  | { kind: 'boolean'; trueLabel: string; falseLabel: string }
  | { kind: 'stepper'; min: number; max: number; step: number }
  // uppercase: el campo pasa lo escrito a mayusculas. Lo decide la vertical.
  | { kind: 'text'; maxLength: number; uppercase: boolean }

export type PanelField = {
  id: string
  labelKey: RequiredTextKey
  control: FieldControl
  // Paso del panel (version 2.8, D94): los campos seguidos con el mismo paso van juntos, en un
  // paso numerado cuyo titulo es la etiqueta del primero. Lo declara la vertical.
  step: string
  // Titulo del paso, si no es la etiqueta del primer campo. El campo con esa etiqueta no la
  // repite.
  stepTitleKey?: RequiredTextKey
}
