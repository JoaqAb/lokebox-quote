import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { MaterialVisual } from '../../../core/types'
import { AutoOrbit } from './AutoOrbit'
import { SignBoard } from './SignBoard'
import { Storefront } from './Storefront'
import type { PerfTier } from './perfTier'
import { usePerfTier } from './usePerfTier'
import {
  CAMERA,
  CONTACT_SHADOW,
  LIGHTS,
  ORBIT,
  PLACEMENT,
  type ScenePalette,
  type SignPlacement,
} from './sceneGeometry'

// Contenido del canvas: camara, ambiente nocturno, set, conjunto del cartel, sombras,
// orbita y barrido. Sin Suspense, sin loaders y sin useLoader: no hay un solo asset
// que se descargue.
// El medidor de rendimiento corre aca adentro, pero el nivel lo guarda SignPreview:
// el dpr es un prop del Canvas y React lo reaplica en cada re-render, asi que si el
// nivel viviera adentro, el primer movimiento de slider devolveria el dpr al nivel 0.

type SignSceneProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  palette: ScenePalette
  reducedMotion: boolean
  tier: PerfTier
  onTierChange: (tier: PerfTier) => void
}

export function SignScene({
  placement,
  material,
  lightingMode,
  palette,
  reducedMotion,
  tier,
  onTierChange,
}: SignSceneProps) {
  const camera = useThree((state) => state.camera)

  usePerfTier(tier, onTierChange)

  useEffect(() => {
    if (tier < 2) {
      return
    }
    // Nivel 2: sin orbita y sin barrido, asi que la camara vuelve una vez a su lugar.
    camera.position.set(...CAMERA.position)
    camera.lookAt(...CAMERA.target)
  }, [camera, tier])

  return (
    <>
      <PerspectiveCamera makeDefault fov={CAMERA.fov} position={CAMERA.position} />

      <ambientLight intensity={LIGHTS.ambientIntensity} />
      <directionalLight
        position={LIGHTS.directionalPosition}
        intensity={LIGHTS.directionalIntensity}
      />

      <Storefront palette={palette} />
      <SignBoard
        placement={placement}
        material={material}
        lightingMode={lightingMode}
        postColor={palette.post}
        reducedMotion={reducedMotion}
      />

      {tier < 1 ? (
        <ContactShadows
          position={PLACEMENT.contactShadow.position}
          scale={PLACEMENT.contactShadow.scale}
          opacity={CONTACT_SHADOW.opacity}
          blur={CONTACT_SHADOW.blur}
          resolution={CONTACT_SHADOW.resolution}
        />
      ) : null}

      {/* makeDefault publica los controles en el store: AutoOrbit los lee con useThree. */}
      {tier < 2 ? <OrbitControls makeDefault target={CAMERA.target} {...ORBIT} /> : null}
      {tier < 2 && !reducedMotion ? <AutoOrbit /> : null}
    </>
  )
}
