// Fondo del escenario del preview (SPEC 12, D103 y D105). Del core: vale para toda vertical y
// para los dos modos del viewer. El canvas es transparente y este fondo va debajo, asi no hay
// plano de fondo en la escena ni horizonte.
// dark: el cartel esta encendido en modo cartel. La capa grafito entra y sale con una transicion
// de opacidad de 375 ms, sin tocar el canvas.

type StageBackdropProps = {
  dark: boolean
}

export function StageBackdrop({ dark }: StageBackdropProps) {
  return (
    <div aria-hidden="true" data-stage-backdrop={dark ? 'dark' : 'light'} className="q-stage-light absolute inset-0">
      <div
        className={`q-stage-dark absolute inset-0 transition-opacity duration-[375ms] ease-out motion-reduce:transition-none ${dark ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
