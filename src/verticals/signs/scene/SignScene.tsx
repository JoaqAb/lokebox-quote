import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import type { MaterialVisual } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { Storefront } from './Storefront'
import {
  CAMERA,
  CONTACT_SHADOW,
  LIGHTS,
  ORBIT,
  PLACEMENT,
  type ScenePalette,
  type SignBox,
} from './sceneGeometry'

// Contenido del canvas: camara, ambiente nocturno, set, cartel y orbita limitada.
// Sin Suspense, sin loaders y sin useLoader: no hay un solo asset que se descargue.

type SignSceneProps = {
  box: SignBox
  material: MaterialVisual
  palette: ScenePalette
  reducedMotion: boolean
}

export function SignScene({ box, material, palette, reducedMotion }: SignSceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault fov={CAMERA.fov} position={CAMERA.position} />

      <ambientLight intensity={LIGHTS.ambientIntensity} />
      <directionalLight
        position={LIGHTS.directionalPosition}
        intensity={LIGHTS.directionalIntensity}
      />

      <Storefront palette={palette} />
      <SignBoard box={box} material={material} reducedMotion={reducedMotion} />

      <ContactShadows
        position={PLACEMENT.contactShadow.position}
        scale={PLACEMENT.contactShadow.scale}
        opacity={CONTACT_SHADOW.opacity}
        blur={CONTACT_SHADOW.blur}
        resolution={CONTACT_SHADOW.resolution}
      />

      <OrbitControls target={CAMERA.target} {...ORBIT} />
    </>
  )
}
