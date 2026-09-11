type RangeSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

export function RangeSlider({ label, value, min, max, step, unit, onChange }: RangeSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        aria-label={label}
        className="q-range h-11 min-w-0 flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber)
        }}
      />
      <output className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
        {value} {unit}
      </output>
    </div>
  )
}
