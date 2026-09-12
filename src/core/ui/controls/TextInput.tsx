// Campo de texto del panel. Quinto kind de SPEC 4.1.
// El valor viaja siempre en la seleccion: el componente no guarda estado propio, igual
// que los otros cuatro controles. El maximo lo pone el JSON del cliente, no el codigo.

type TextInputProps = {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}

export function TextInput({ label, value, maxLength, onChange }: TextInputProps) {
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
        onChange(event.currentTarget.value)
      }}
    />
  )
}
