type Choice = { id: string; label: string }

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
            className={
              active
                ? 'q-control q-on flex-1'
                : 'q-control q-off flex-1'
            }
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
