import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  Color,
  MathUtils,
  type AmbientLight,
  type DirectionalLight,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three'
import type { MaterialVisual } from '../../../core/types'
import { AutoOrbit } from './AutoOrbit'
import { SignBoard } from './SignBoard'
import { SignFace } from './SignFace'
import { Storefront } from './Storefront'
import type { PerfTier } from './perfTier'
import { usePerfTier } from './usePerfTier'
import {
  CAMERA,
  CONTACT_SHADOW,
  DUSK,
  LIGHTS,
  ORBIT,
  PLACEMENT,
  duskTarget,
  type ScenePalette,
  type SignPlacement,
} from './sceneGeometry'

// Contenido del canvas: camara, ambiente, set, conjunto del cartel, texto en la cara,
// sombras, orbita y barrido. Sin Suspense, sin loaders y sin useLoader: no hay un solo
// asset que se descargue. Las unicas texturas son las CanvasTexture de runtime.
// El medidor de rendimiento corre aca adentro, pero el nivel lo guarda SignPreview:
// el dpr es un prop del Canvas y React lo reaplica en cada re-render, asi que si el
// nivel viviera adentro, el primer movimiento de slider devolveria el dpr al nivel 0.

type SignSceneProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  text: string
  palette: ScenePalette
  reducedMotion: boolean
  tier: PerfTier
  onTierChange: (tier: PerfTier) => void
}

export function SignScene({
  placement,
  material,
  lightingMode,
  text,
  palette,
  reducedMotion,
  tier,
  onTierChange,
}: SignSceneProps) {
  usePerfTier(tier, onTierChange)

  const ambientRef = useRef<AmbientLight>(null)
  const directionalRef = useRef<DirectionalLight>(null)
  const backdropRef = useRef<MeshBasicMaterial>(null)
  const sidewalkRef = useRef<MeshStandardMaterial>(null)
  const dusk = useRef(0)

  // Colores de los dos extremos de la hora de la escena. Se derivan una vez por paleta.
  const tones = useMemo(() => {
    const text2 = new Color(palette.shadow)
    return {
      backdropDay: new Color(palette.backdrop),
      backdropDusk: new Color(palette.backdrop).lerp(text2, DUSK.backdropMix),
      sidewalkDay: new Color(palette.sidewalk),
      sidewalkDusk: new Color(palette.sidewalk).lerp(text2, DUSK.sidewalkMix),
      lightDay: new Color(palette.dayLight),
      lightDusk: new Color(palette.duskLight),
    }
  }, [palette])

  // Un solo escalar con damp mueve ambiente, direccional, fondo y vereda (SPEC 12).
  // Sin geometria nueva y sin luces nuevas.
  useFrame((_state, delta) => {
    const ambient = ambientRef.current
    const directional = directionalRef.current
    const backdrop = backdropRef.current
    const sidewalk = sidewalkRef.current
    if (ambient === null || directional === null || backdrop === null || sidewalk === null) {
      return
    }
    dusk.current = reducedMotion
      ? duskTarget(lightingMode)
      : MathUtils.damp(dusk.current, duskTarget(lightingMode), DUSK.lambda, delta)
    const t = dusk.current

    ambient.intensity = MathUtils.lerp(DUSK.ambient.day, DUSK.ambient.dusk, t)
    directional.intensity = MathUtils.lerp(DUSK.directional.day, DUSK.directional.dusk, t)
    directional.color.copy(tones.lightDay).lerp(tones.lightDusk, t)
    backdrop.color.copy(tones.backdropDay).lerp(tones.backdropDusk, t)
    sidewalk.color.copy(tones.sidewalkDay).lerp(tones.sidewalkDusk, t)
  })

  return (
    <>
      <PerspectiveCamera makeDefault fov={CAMERA.fov} position={CAMERA.position} />

      <ambientLight ref={ambientRef} intensity={LIGHTS.ambientIntensity} />
      <directionalLight
        ref={directionalRef}
        position={LIGHTS.directionalPosition}
        intensity={LIGHTS.directionalIntensity}
      />

      <Storefront palette={palette} backdropRef={backdropRef} sidewalkRef={sidewalkRef} />
      <SignBoard
        placement={placement}
        material={material}
        lightingMode={lightingMode}
        postColor={palette.post}
        shadowColor={palette.shadow}
        reducedMotion={reducedMotion}
      />
      <SignFace placement={placement} color={palette.signText} text={text} />

      {tier < 1 ? (
        <ContactShadows
          position={PLACEMENT.contactShadow.position}
          scale={PLACEMENT.contactShadow.scale}
          opacity={CONTACT_SHADOW.opacity}
          blur={CONTACT_SHADOW.blur}
          resolution={CONTACT_SHADOW.resolution}
        />
      ) : null}

      {/* makeDefault publica los controles en el store: AutoOrbit los lee con useThree.
          La orbita no depende del nivel: es entrada del usuario, no costo de dibujo, y
          apagarla no se distingue de una pagina rota (SPEC 12). */}
      <OrbitControls makeDefault target={CAMERA.target} {...ORBIT} />
      {/* El barrido si se apaga en el nivel 2: es animacion continua y cosmetica. */}
      {tier < 2 && !reducedMotion ? <AutoOrbit /> : null}
    </>
  )
}
