import type { Choice } from '../panelTypes'

// Grupo de opciones. Con swatch (version 2.8, D94) cada opcion muestra su color junto a la
// etiqueta; el color viene en el descriptor y el core no sabe de donde sale.

type ChoiceGroupProps = {
  label: string
  choices: Choice[]
  value: string
  onSelect: (id: string) => void
}

export function ChoiceGroup({ label, choices, value, onSelect }: ChoiceGroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const active = choice.id === value
        return (
          <button
            key={choice.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onSelect(choice.id)
            }}
            className={active ? 'q-control q-on flex-1 gap-2' : 'q-control q-off flex-1 gap-2'}
          >
            {choice.swatch === undefined ? null : (
              <span
                aria-hidden="true"
                data-swatch={choice.swatch}
                className="q-swatch size-4 shrink-0 rounded-full"
                style={{ background: choice.swatch }}
              />
            )}
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
