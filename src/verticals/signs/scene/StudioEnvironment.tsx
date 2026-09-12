import { Environment } from '@react-three/drei'
import { Component, Suspense, type ReactNode } from 'react'

// El HDRI de estudio, uno solo para todo el producto (SPEC 3 y 12). Hace que metalness
// se lea: con sola una direccional el aluminio se ve igual que el PVC.
// Va aislado detras de un limite de error a proposito. Un archivo ausente, o un servidor
// que responde el index.html de la SPA en su lugar, hace que el loader lance, y sin este
// limite ese error se lleva puesto el canvas entero y el preview queda en blanco. La
// regla es que sin HDRI el preview funciona igual, sin reflejo.

type LimiteProps = { children: ReactNode }
type LimiteState = { caido: boolean }

class LimiteDeHdri extends Component<LimiteProps, LimiteState> {
  state: LimiteState = { caido: false }

  static getDerivedStateFromError(): LimiteState {
    return { caido: true }
  }

  render(): ReactNode {
    return this.state.caido ? null : this.props.children
  }
}

export function StudioEnvironment({ src }: { src: string }) {
  return (
    <LimiteDeHdri>
      <Suspense fallback={null}>
        <Environment files={src} />
      </Suspense>
    </LimiteDeHdri>
  )
}
