type StepperProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

const BUTTON_CLASS =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-medium text-[var(--q-text)] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--q-accent)] disabled:opacity-30'

export function Stepper({ label, value, min, max, step, onChange }: StepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
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
