import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, MathUtils, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type PointLight } from 'three'
import type { MaterialVisual } from '../../../core/types'
import { supportShadowTexture } from './supportShadow'
import {
  DAMP_LAMBDA,
  SET,
  SETTLE_EPSILON,
  SUPPORT_SHADOW,
  UNIT_BOX,
  UNIT_PLANE,
  VISIBLE_EPSILON,
  haloBox,
  lampPosition,
  lightingParams,
  supportShadowBox,
  type SignPlacement,
} from './sceneGeometry'

// El conjunto entero: cartel, halo, sombra de apoyo y la unica luz dinamica, con un solo
// useFrame. Repartirlos los deja desincronizados durante las transiciones de medida.
// Ninguna medida ni ningun color se escribe aca: todo sale de sceneGeometry y del visual.
// Nada viaja como prop de JSX si lo maneja el frame loop: React lo aplicaria de una
// en cada cambio de opcion y pisaria la transicion.
// El cartel esta centrado en el origen: sobre que foto y en que parte se dibuja lo
// resuelve la capa de composicion (SPEC 12, version 1.9).

// Base del halo: lo que se ve es su emision, no su color iluminado.
const HALO_BASE_COLOR = new Color(0, 0, 0)

// Damp que cierra exacto: sin esto el valor final nunca es el de la tabla.
function approach(current: number, target: number, delta: number): number {
  const next = MathUtils.damp(current, target, DAMP_LAMBDA, delta)
  return Math.abs(target - next) < SETTLE_EPSILON ? target : next
}

function approachColor(current: Color, target: Color, delta: number): void {
  const distance =
    Math.abs(current.r - target.r) + Math.abs(current.g - target.g) + Math.abs(current.b - target.b)
  if (distance < SETTLE_EPSILON) {
    current.copy(target)
    return
  }
  current.lerp(target, 1 - Math.exp(-DAMP_LAMBDA * delta))
}

type SignBoardProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  shadowColor: string
  reducedMotion: boolean
}

export function SignBoard({
  placement,
  material,
  lightingMode,
  shadowColor,
  reducedMotion,
}: SignBoardProps) {
  const signRef = useRef<Mesh>(null)
  const signMaterialRef = useRef<MeshStandardMaterial>(null)
  const haloRef = useRef<Mesh>(null)
  const haloMaterialRef = useRef<MeshStandardMaterial>(null)
  const lampRef = useRef<PointLight>(null)
  const shadowRef = useRef<Mesh>(null)
  const shadowMaterialRef = useRef<MeshBasicMaterial>(null)
  const started = useRef(false)
  const targetColor = useMemo(() => new Color(material.color), [material.color])

  useFrame((_state, delta) => {
    const sign = signRef.current
    const signMaterial = signMaterialRef.current
    const halo = haloRef.current
    const haloMaterial = haloMaterialRef.current
    const lamp = lampRef.current
    const shadow = shadowRef.current
    if (
      sign === null ||
      signMaterial === null ||
      halo === null ||
      haloMaterial === null ||
      lamp === null ||
      shadow === null
    ) {
      return
    }

    const lighting = lightingParams(lightingMode)
    const haloTarget = haloBox(placement)
    const lampTarget = lampPosition(lightingMode, placement)
    const haloOpacity = Math.min(1, lighting.haloIntensity)

    // El primer frame se acomoda de golpe, para no entrar con una animacion de carga.
    const instant = reducedMotion || !started.current
    started.current = true
    const move = (current: number, target: number): number =>
      instant ? target : approach(current, target, delta)

    sign.scale.x = move(sign.scale.x, placement.box.width)
    sign.scale.y = move(sign.scale.y, placement.box.height)
    sign.scale.z = SET.sign.thickness

    if (instant) {
      signMaterial.color.copy(targetColor)
      signMaterial.emissive.copy(targetColor)
    } else {
      approachColor(signMaterial.color, targetColor, delta)
      approachColor(signMaterial.emissive, targetColor, delta)
    }
    signMaterial.metalness = move(signMaterial.metalness, material.metalness)
    signMaterial.roughness = move(signMaterial.roughness, material.roughness)
    signMaterial.emissiveIntensity = move(
      signMaterial.emissiveIntensity,
      lighting.emissiveIntensity,
    )

    halo.scale.x = move(halo.scale.x, haloTarget.size[0])
    halo.scale.y = move(halo.scale.y, haloTarget.size[1])
    halo.position.z = haloTarget.z
    if (instant) {
      haloMaterial.emissive.copy(targetColor)
    } else {
      approachColor(haloMaterial.emissive, targetColor, delta)
    }
    haloMaterial.emissiveIntensity = move(haloMaterial.emissiveIntensity, lighting.haloIntensity)
    haloMaterial.opacity = move(haloMaterial.opacity, haloOpacity)
    halo.visible = haloMaterial.emissiveIntensity > VISIBLE_EPSILON

    // Una sola luz dinamica, siempre montada: apagarla es bajar su intensidad a 0.
    // Montarla y desmontarla por modo recompila los shaders de toda la escena.
    if (lampTarget !== null) {
      lamp.position.x = move(lamp.position.x, lampTarget[0])
      lamp.position.y = move(lamp.position.y, lampTarget[1])
      lamp.position.z = move(lamp.position.z, lampTarget[2])
    }
    lamp.color.copy(targetColor)
    lamp.intensity = move(lamp.intensity, lighting.lampIntensity)
    lamp.decay = lighting.lampDecay
    lamp.distance = lighting.lampDistance

    // La sombra de apoyo sigue al cartel: es lo que impide que flote sobre la foto.
    const shadowTarget = supportShadowBox(placement)
    shadow.scale.x = move(shadow.scale.x, shadowTarget.size[0])
    shadow.scale.y = move(shadow.scale.y, shadowTarget.size[1])
    shadow.position.y = move(shadow.position.y, shadowTarget.position[1])
    shadow.position.z = shadowTarget.position[2]
  })

  return (
    <group>
      <mesh ref={signRef} scale={UNIT_BOX}>
        <boxGeometry args={UNIT_BOX} />
        <meshStandardMaterial ref={signMaterialRef} />
      </mesh>

      <mesh ref={haloRef} scale={UNIT_BOX}>
        <planeGeometry args={UNIT_PLANE} />
        <meshStandardMaterial
          ref={haloMaterialRef}
          color={HALO_BASE_COLOR}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh ref={shadowRef} scale={UNIT_BOX}>
        <planeGeometry args={UNIT_PLANE} />
        <meshBasicMaterial
          ref={shadowMaterialRef}
          color={shadowColor}
          alphaMap={supportShadowTexture()}
          transparent
          opacity={SUPPORT_SHADOW.opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={lampRef} />
    </group>
  )
}
