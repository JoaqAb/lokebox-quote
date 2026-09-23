import { Component, type ReactNode } from 'react'

// Limite de error para un asset opcional del preview. Un archivo ausente, o un servidor que
// responde el index.html de la SPA en su lugar, hace que el loader lance; sin este limite ese
// error se lleva puesto el canvas entero y el preview queda en blanco. Con el, la escena sigue
// con el fallback: sin texto si falta el typeface.

type AssetBoundaryProps = { fallback: ReactNode; children: ReactNode }
type AssetBoundaryState = { failed: boolean }

export class AssetBoundary extends Component<AssetBoundaryProps, AssetBoundaryState> {
  state: AssetBoundaryState = { failed: false }

  static getDerivedStateFromError(): AssetBoundaryState {
    return { failed: true }
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
