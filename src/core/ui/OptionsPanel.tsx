import type { ClientTexts } from '../types'
import { BooleanChoice } from './controls/BooleanChoice'
import { ChoiceGroup } from './controls/ChoiceGroup'
import { RangeSlider } from './controls/RangeSlider'
import { Stepper } from './controls/Stepper'
import { TextInput } from './controls/TextInput'
import type { PanelField, SelectionValue } from './panelTypes'

// Panel generico: recorre los descriptores en el orden recibido y despacha por kind.
// No importa nada de src/verticals ni de src/clients. Los textos salen de texts.

type OptionsPanelProps = {
  title: string
  fields: PanelField[]
  values: Record<string, SelectionValue>
  texts: ClientTexts
  locale: string
  onChange: (fieldId: string, value: SelectionValue) => void
}

function wrongValue(fieldId: string, expected: string, value: SelectionValue): Error {
  return new Error(`OptionsPanel: el campo "${fieldId}" espera un ${expected} y llego: ${String(value)}`)
}

function readString(fieldId: string, value: SelectionValue): string {
  if (typeof value !== 'string') {
    throw wrongValue(fieldId, 'string', value)
  }
  return value
}

function readNumber(fieldId: string, value: SelectionValue): number {
  if (typeof value !== 'number') {
    throw wrongValue(fieldId, 'numero', value)
  }
  return value
}

function readBoolean(fieldId: string, value: SelectionValue): boolean {
  if (typeof value !== 'boolean') {
    throw wrongValue(fieldId, 'booleano', value)
  }
  return value
}

type FieldRowProps = {
  field: PanelField
  label: string
  locale: string
  value: SelectionValue
  onChange: (fieldId: string, value: SelectionValue) => void
}

function FieldControlView({ field, label, locale, value, onChange }: FieldRowProps) {
  const control = field.control
  if (control.kind === 'choice') {
    return (
      <ChoiceGroup
        label={label}
        choices={control.choices}
        value={readString(field.id, value)}
        onSelect={(next) => {
          onChange(field.id, next)
        }}
      />
    )
  }
  if (control.kind === 'range') {
    return (
      <RangeSlider
        label={label}
        locale={locale}
        value={readNumber(field.id, value)}
        min={control.min}
        max={control.max}
        step={control.step}
        unit={control.unit}
        onChange={(next) => {
          onChange(field.id, next)
        }}
      />
    )
  }
  if (control.kind === 'text') {
    return (
      <TextInput
        label={label}
        value={readString(field.id, value)}
        maxLength={control.maxLength}
        uppercase={control.uppercase}
        onChange={(next) => {
          onChange(field.id, next)
        }}
      />
    )
  }
  if (control.kind === 'boolean') {
    return (
      <BooleanChoice
        label={label}
        value={readBoolean(field.id, value)}
        trueLabel={control.trueLabel}
        falseLabel={control.falseLabel}
        onSelect={(next) => {
          onChange(field.id, next)
        }}
      />
    )
  }
  return (
    <Stepper
      label={label}
      value={readNumber(field.id, value)}
      min={control.min}
      max={control.max}
      step={control.step}
      onChange={(next) => {
        onChange(field.id, next)
      }}
    />
  )
}

export function OptionsPanel({
  title,
  fields,
  values,
  texts,
  locale,
  onChange,
}: OptionsPanelProps) {
  return (
    <section className="pt-6">
      <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">{title}</h2>
      <div className="mt-4 flex flex-col gap-6">
        {fields.map((field) => {
          const label = texts[field.labelKey]
          return (
            <div key={field.id} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[var(--q-text)]">{label}</p>
              <FieldControlView
                field={field}
                label={label}
                locale={locale}
                value={values[field.id]}
                onChange={onChange}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
