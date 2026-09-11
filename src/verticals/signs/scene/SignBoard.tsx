import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, MathUtils, type Mesh, type MeshStandardMaterial, type PointLight } from 'three'
import type { MaterialVisual } from '../../../core/types'
import {
  DAMP_LAMBDA,
  HALO,
  LAMP,
  POST_FINISH,
  SET,
  SETTLE_EPSILON,
  TOTEM,
  UNIT_BOX,
  UNIT_PLANE,
  VISIBLE_EPSILON,
  WINDOW_TOP,
  haloBox,
  lampPosition,
  lightingParams,
  type SignPlacement,
  type Vec3,
} from './sceneGeometry'

// El conjunto entero: cartel, poste, halo y la unica luz dinamica, con un solo useFrame.
// Repartirlos en cuatro componentes con su propio damp los deja desincronizados durante
// las transiciones, sobre todo al pasar de facade a totem.
// Ninguna medida ni ningun color se escribe aca: todo sale de sceneGeometry y del visual.
// Nada viaja como prop de JSX si lo maneja el frame loop: React lo aplicaria de una
// en cada cambio de opcion y pisaria la transicion.

const SIGN_INITIAL_POSITION: Vec3 = [0, WINDOW_TOP + SET.sign.gapOverWindow, SET.sign.z]
const POST_INITIAL_POSITION: Vec3 = [TOTEM.x, 0, TOTEM.z]
const HALO_INITIAL_POSITION: Vec3 = [
  0,
  WINDOW_TOP + SET.sign.gapOverWindow,
  SET.sign.z - SET.sign.thickness / 2 - HALO.gap,
]

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
  postColor: string
  reducedMotion: boolean
}

export function SignBoard({
  placement,
  material,
  lightingMode,
  postColor,
  reducedMotion,
}: SignBoardProps) {
  const signRef = useRef<Mesh>(null)
  const signMaterialRef = useRef<MeshStandardMaterial>(null)
  const postRef = useRef<Mesh>(null)
  const haloRef = useRef<Mesh>(null)
  const haloMaterialRef = useRef<MeshStandardMaterial>(null)
  const lampRef = useRef<PointLight>(null)
  const started = useRef(false)
  const targetColor = useMemo(() => new Color(material.color), [material.color])

  useFrame((_state, delta) => {
    const sign = signRef.current
    const signMaterial = signMaterialRef.current
    const post = postRef.current
    const halo = haloRef.current
    const haloMaterial = haloMaterialRef.current
    const lamp = lampRef.current
    if (
      sign === null ||
      signMaterial === null ||
      post === null ||
      halo === null ||
      haloMaterial === null ||
      lamp === null
    ) {
      return
    }

    const lighting = lightingParams(lightingMode)
    const haloTarget = haloBox(placement)
    const lampTarget = lampPosition(lightingMode, placement)
    const postTarget = placement.post
    const postHeight = postTarget === null ? 0 : postTarget.size[1]
    const haloOpacity = Math.min(1, lighting.haloIntensity)

    // El primer frame se acomoda de golpe, para no entrar con una animacion de carga.
    const instant = reducedMotion || !started.current
    started.current = true
    const move = (current: number, target: number): number =>
      instant ? target : approach(current, target, delta)

    sign.scale.x = move(sign.scale.x, placement.box.width)
    sign.scale.y = move(sign.scale.y, placement.box.height)
    sign.scale.z = SET.sign.thickness
    sign.position.x = move(sign.position.x, placement.position[0])
    sign.position.y = move(sign.position.y, placement.position[1])
    sign.position.z = move(sign.position.z, placement.position[2])

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

    // El poste crece desde el piso mientras el cartel llega a la vereda.
    if (postTarget !== null) {
      post.scale.x = move(post.scale.x, postTarget.size[0])
      post.scale.z = move(post.scale.z, postTarget.size[2])
    }
    post.scale.y = move(post.scale.y, postHeight)
    post.position.y = post.scale.y / 2
    post.visible = post.scale.y > VISIBLE_EPSILON

    halo.scale.x = move(halo.scale.x, haloTarget.size[0])
    halo.scale.y = move(halo.scale.y, haloTarget.size[1])
    halo.position.x = move(halo.position.x, haloTarget.position[0])
    halo.position.y = move(halo.position.y, haloTarget.position[1])
    halo.position.z = move(halo.position.z, haloTarget.position[2])
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
  })

  return (
    <group>
      <mesh ref={signRef} position={SIGN_INITIAL_POSITION} scale={UNIT_BOX}>
        <boxGeometry args={UNIT_BOX} />
        <meshStandardMaterial ref={signMaterialRef} />
      </mesh>

      <mesh ref={postRef} position={POST_INITIAL_POSITION} scale={UNIT_BOX}>
        <boxGeometry args={UNIT_BOX} />
        <meshStandardMaterial
          color={postColor}
          metalness={POST_FINISH.metalness}
          roughness={POST_FINISH.roughness}
        />
      </mesh>

      <mesh ref={haloRef} position={HALO_INITIAL_POSITION} scale={UNIT_BOX}>
        <planeGeometry args={UNIT_PLANE} />
        <meshStandardMaterial
          ref={haloMaterialRef}
          color={HALO_BASE_COLOR}
          transparent
          depthWrite={false}
        />
      </mesh>

      <pointLight ref={lampRef} decay={LAMP.decay} distance={LAMP.distance} />
    </group>
  )
}
