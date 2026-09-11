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
                ? 'min-h-11 flex-1 rounded-xl border border-[var(--q-accent)] bg-[var(--q-accent)] px-3 py-2 text-sm font-medium text-[var(--q-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
                : 'min-h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[var(--q-text)] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
            }
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
