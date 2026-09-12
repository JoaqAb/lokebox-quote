type StepperProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

const BUTTON_CLASS = 'q-control q-off h-11 w-11 shrink-0 px-0 text-lg disabled:opacity-30'

export function Stepper({ label, value, min, max, step, onChange }: StepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`${label}: -`}
        className={BUTTON_CLASS}
        disabled={value <= min}
        onClick={() => {
          onChange(Math.max(min, value - step))
        }}
      >
        -
      </button>
      <output className="w-10 text-center text-base font-medium tabular-nums">{value}</output>
      <button
        type="button"
        aria-label={`${label}: +`}
        className={BUTTON_CLASS}
        disabled={value >= max}
        onClick={() => {
          onChange(Math.min(max, value + step))
        }}
      >
        +
      </button>
    </div>
  )
}
