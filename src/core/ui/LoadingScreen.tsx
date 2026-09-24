import { useProgress } from '@react-three/drei'

// Pantalla de carga del preview (SPEC 12, version 2.0, D47). Ocupa el marco entero sobre
// el escenario claro del core (D103), con su tinta fija (D128), con el logo del cliente y su loadingLabel. El progreso es el real del
// LoadingManager de three, sin animacion simulada ni minimos: la barra va donde va la carga.
// Queda montada en posicion absoluta y se apaga con opacidad, asi al terminar no mueve nada
// del layout. aria-busy dice si la escena todavia no dibujo.

export type LoadingBrand = {
  logo: string
  brandName: string
  label: string
}

type LoadingScreenProps = {
  brand: LoadingBrand
  // true cuando la escena ya dibujo su primer frame.
  done: boolean
}

export function LoadingScreen({ brand, done }: LoadingScreenProps) {
  const { progress } = useProgress()
  const pct = Math.round(progress)

  return (
    <div
      role="status"
      aria-busy={!done}
      aria-hidden={done}
      className={`absolute inset-0 flex flex-col items-center justify-center gap-5 q-stage-light transition-opacity duration-300 motion-reduce:transition-none ${done ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="rounded-xl bg-[var(--q-bg)] px-5 py-3">
        <img src={brand.logo} alt={brand.brandName} className="h-8 w-auto" />
      </div>
      <div className="flex w-2/5 max-w-xs min-w-40 flex-col items-center gap-3">
        <div
          role="progressbar"
          aria-label={brand.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--q-text)_14%,transparent)]"
        >
          <div className="h-full rounded-full bg-[var(--q-accent)]" style={{ width: `${String(pct)}%` }} />
        </div>
        <span className="text-xs font-semibold tracking-[0.18em] text-[var(--q-stage-ink)] uppercase">{brand.label}</span>
      </div>
    </div>
  )
}
