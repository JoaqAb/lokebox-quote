import type { StageTone } from '../theme'

// Fondo del escenario del preview (SPEC 12, D103 y D105). Del core: vale para toda vertical y
// para los dos modos del viewer. El canvas es transparente y este fondo va debajo, asi no hay
// plano de fondo en la escena ni horizonte.
// lit: el cartel esta encendido en modo cartel. Con el tono claro la capa grafito entra y sale
// con una transicion de opacidad de 375 ms, sin tocar el canvas.
// tone (version 2.13, D132): con un tema oscuro el escenario es grafito fijo desde la carga, en
// los dos modos, y no cambia con lit. No hay capa clara debajo: no puede asomar en ningun cuadro.

type StageBackdropProps = {
  tone: StageTone
  lit: boolean
}

export function StageBackdrop({ tone, lit }: StageBackdropProps) {
  if (tone === 'dark') {
    return <div aria-hidden="true" data-stage-backdrop="dark" className="q-stage-dark absolute inset-0" />
  }
  return (
    <div aria-hidden="true" data-stage-backdrop={lit ? 'dark' : 'light'} className="q-stage-light absolute inset-0">
      <div
        className={`q-stage-dark absolute inset-0 transition-opacity duration-[375ms] ease-out motion-reduce:transition-none ${lit ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
