import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef, type RefObject } from 'react'
import type { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { useStudioFraming, type StudioFrame } from './studioFraming'
import { STUDIO_VIEW, type Vec3 } from './studioView'

// Camara del modo de estudio (SPEC 12 y 21.5): fov fijo, OrbitControls con azimut libre y polar
// acotado, y el encuadre de studioFraming. En el core desde TAREA_033 (D143). Una vertical con
// otros modos de camara usa el hook sobre su propia camara; una que solo tiene estudio usa
// StudioCamera.

// La camara en perspectiva del preview, con los planos del modo de estudio.
export function StudioPerspective({ cameraRef }: { cameraRef: RefObject<PerspectiveCameraImpl | null> }) {
  return <PerspectiveCamera ref={cameraRef} makeDefault fov={STUDIO_VIEW.fovDeg} near={STUDIO_VIEW.near} far={STUDIO_VIEW.far} />
}

// La orbita del modo de estudio: sin pan ni zoom propio, con el polar acotado.
export function StudioOrbitControls({ center }: { center: Vec3 }) {
  return (
    <OrbitControls
      target={center}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={STUDIO_VIEW.minPolar}
      maxPolarAngle={STUDIO_VIEW.maxPolar}
    />
  )
}

// La camara completa de una vista que solo tiene modo de estudio.
export function StudioCamera(frame: StudioFrame) {
  const cameraRef = useRef<PerspectiveCameraImpl>(null)
  useStudioFraming(cameraRef, frame, true)
  return (
    <>
      <StudioPerspective cameraRef={cameraRef} />
      <StudioOrbitControls center={frame.center} />
    </>
  )
}
