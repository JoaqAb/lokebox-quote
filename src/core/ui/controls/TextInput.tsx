// Campo de texto del panel. Quinto kind de SPEC 4.1.
// El valor viaja siempre en la seleccion: el componente no guarda estado propio, igual
// que los otros cuatro controles. El maximo lo pone el JSON del cliente, no el codigo.
// Con uppercase lo escrito se pasa a mayusculas antes de llegar a la seleccion.

type TextInputProps = {
  label: string
  value: string
  maxLength: number
  uppercase: boolean
  onChange: (value: string) => void
}

export function TextInput({ label, value, maxLength, uppercase, onChange }: TextInputProps) {
  return (
    <input
      type="text"
      aria-label={label}
      value={value}
      maxLength={maxLength}
      autoComplete="off"
      spellCheck={false}
      className="q-control q-off w-full justify-start text-left"
      onChange={(event) => {
        const input = event.currentTarget
        const next = uppercase ? input.value.toUpperCase() : input.value
        // Reescribir el valor del campo manda el cursor al final: se devuelve donde estaba,
        // asi corregir una letra en el medio de la palabra no salta.
        if (next !== input.value) {
          const { selectionStart, selectionEnd } = input
          input.value = next
          input.setSelectionRange(selectionStart, selectionEnd)
        }
        onChange(next)
      }}
    />
  )
}
