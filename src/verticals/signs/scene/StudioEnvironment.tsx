import { Environment } from '@react-three/drei'
import { AssetBoundary } from '../../../core/preview/AssetBoundary'

// El HDRI de estudio, uno solo para todo el producto (SPEC 12). Hace que metalness se lea:
// con sola una direccional el aluminio se ve igual que el PVC.
// Suspende en el Suspense del canvas del core (version 2.0): la carga entra en el progreso de
// la pantalla de carga. Va detras de un limite de error: sin HDRI el preview funciona igual,
// sin reflejo.

export function StudioEnvironment({ src }: { src: string }) {
  return (
    <AssetBoundary fallback={null}>
      <Environment files={src} />
    </AssetBoundary>
  )
}
