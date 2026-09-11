type BooleanChoiceProps = {
  label: string
  value: boolean
  trueLabel: string
  falseLabel: string
  onSelect: (value: boolean) => void
}

export function BooleanChoice({ label, value, trueLabel, falseLabel, onSelect }: BooleanChoiceProps) {
  const options: { flag: boolean; text: string }[] = [
    { flag: true, text: trueLabel },
    { flag: false, text: falseLabel },
  ]
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.flag === value
        return (
          <button
            key={option.text}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onSelect(option.flag)
            }}
            className={
              active
                ? 'min-h-11 flex-1 rounded-xl border border-[var(--q-accent)] bg-[var(--q-accent)] px-3 py-2 text-sm font-medium text-[var(--q-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
                : 'min-h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[var(--q-text)] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)]'
            }
          >
            {option.text}
          </button>
        )
      })}
    </div>
  )
}
