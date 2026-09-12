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
                ? 'q-control q-on flex-1'
                : 'q-control q-off flex-1'
            }
          >
            {option.text}
          </button>
        )
      })}
    </div>
  )
}
