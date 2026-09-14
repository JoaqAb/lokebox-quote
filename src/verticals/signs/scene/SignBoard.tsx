import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  MathUtils,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from 'three'
import type { MaterialVisual } from '../../../core/types'
import { haloCellGeometry } from './haloGeometry'
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
  haloCells,
  lampPosition,
  lightingParams,
  supportShadowBox,
  type HaloCellKind,
  type LetterBox,
  type SignPlacement,
} from './sceneGeometry'

// El conjunto entero: cartel, halo, sombra de apoyo y la unica luz dinamica, con un solo
// useFrame. Repartirlos los deja desincronizados durante las transiciones de medida.
// Ninguna medida ni ningun color se escribe aca: todo sale de sceneGeometry y del visual.
// Nada viaja como prop de JSX si lo maneja el frame loop: React lo aplicaria de una
// en cada cambio de opcion y pisaria la transicion.
// El cartel esta centrado en el origen y no rota: la camara orbita a su alrededor
// (SPEC 12, version 1.12).
// Cada caja lleva seis materiales, uno por cara, en el orden de BoxGeometry: +x, -x, +y,
// -y, frente, atras. Asi en back emiten los cantos y la cara trasera y la cara frontal
// emite poco, para que el texto se lea. En modo letters el panel se oculta y se dibuja
// una caja por letra; placement.box es el contorno de la palabra, y halo, sombra y
// lampara lo siguen igual que al panel.

const FACE_COUNT = 6
const FRONT_FACE_INDEX = 4

const HALO_KINDS: HaloCellKind[] = [
  'center',
  'left',
  'right',
  'top',
  'bottom',
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
]

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
  // null en modo area.
  letters: LetterBox[] | null
  // Profundidad de las letras, en metros.
  letterDepth: number
  // El halo de back solo existe en modo vista.
  haloEnabled: boolean
}

type FaceMaterial = { material: MeshStandardMaterial; front: boolean }

export function SignBoard({
  placement,
  material,
  lightingMode,
  shadowColor,
  reducedMotion,
  letters,
  letterDepth,
  haloEnabled,
}: SignBoardProps) {
  const signRef = useRef<Mesh>(null)
  const faceMaterialsRef = useRef(new Map<string, FaceMaterial>())
  const haloMeshesRef = useRef<(Mesh | null)[]>([])
  const haloMaterialsRef = useRef<(MeshBasicMaterial | null)[]>([])
  const lampRef = useRef<PointLight>(null)
  const shadowRef = useRef<Mesh>(null)
  // Estado amortiguado del material, compartido por todas las caras de todas las cajas.
  const look = useRef({
    color: new Color(),
    metalness: 0,
    roughness: 1,
    face: 0,
    edge: 0,
    haloOpacity: 0,
    started: false,
  })
  const targetColor = useMemo(() => new Color(material.color), [material.color])
  const letterGeometry = useMemo(() => new BoxGeometry(...UNIT_BOX), [])
  useEffect(
    () => () => {
      letterGeometry.dispose()
    },
    [letterGeometry],
  )

  function faceMaterials(owner: string) {
    return Array.from({ length: FACE_COUNT }, (_unused, index) => {
      const key = `${owner}-${String(index)}`
      return (
        <meshStandardMaterial
          key={key}
          attach={`material-${String(index)}`}
          ref={(instance) => {
            if (instance === null) {
              faceMaterialsRef.current.delete(key)
            } else {
              faceMaterialsRef.current.set(key, { material: instance, front: index === FRONT_FACE_INDEX })
            }
          }}
        />
      )
    })
  }

  useFrame((_state, delta) => {
    const sign = signRef.current
    const lamp = lampRef.current
    const shadow = shadowRef.current
    if (sign === null || lamp === null || shadow === null) {
      return
    }

    const lighting = lightingParams(lightingMode)
    const lampTarget = lampPosition(lightingMode, placement)
    const state = look.current

    // El primer frame se acomoda de golpe, para no entrar con una animacion de carga.
    const instant = reducedMotion || !state.started
    state.started = true
    const move = (current: number, target: number): number =>
      instant ? target : approach(current, target, delta)

    sign.scale.x = move(sign.scale.x, placement.box.width)
    sign.scale.y = move(sign.scale.y, placement.box.height)
    sign.scale.z = SET.sign.thickness
    sign.visible = letters === null

    if (instant) {
      state.color.copy(targetColor)
    } else {
      approachColor(state.color, targetColor, delta)
    }
    state.metalness = move(state.metalness, material.metalness)
    state.roughness = move(state.roughness, material.roughness)
    state.face = move(state.face, lighting.faceEmissiveIntensity)
    state.edge = move(state.edge, lighting.edgeEmissiveIntensity)
    state.haloOpacity = move(state.haloOpacity, haloEnabled ? lighting.haloOpacity : 0)

    for (const { material: face, front } of faceMaterialsRef.current.values()) {
      face.color.copy(state.color)
      face.emissive.copy(state.color)
      face.metalness = state.metalness
      face.roughness = state.roughness
      face.emissiveIntensity = front ? state.face : state.edge
    }

    // El halo sigue al tamano amortiguado del cartel, no al objetivo: asi no se adelanta.
    const cells = haloCells({ box: { width: sign.scale.x, height: sign.scale.y } })
    const haloZ = haloBox(placement).z
    const haloVisible = state.haloOpacity > VISIBLE_EPSILON
    cells.forEach((cell, index) => {
      const mesh = haloMeshesRef.current[index]
      const haloMaterial = haloMaterialsRef.current[index]
      if (mesh === null || mesh === undefined || haloMaterial === null || haloMaterial === undefined) {
        return
      }
      mesh.position.set(cell.position[0], cell.position[1], haloZ)
      mesh.scale.set(cell.size[0], cell.size[1], 1)
      mesh.visible = haloVisible
      haloMaterial.color.copy(state.color)
      haloMaterial.opacity = state.haloOpacity
    })

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

    // La sombra de apoyo sigue al cartel: es lo que impide que flote.
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
        {faceMaterials('panel')}
      </mesh>

      {letters === null
        ? null
        : letters.map((letter, index) => (
            <mesh
              key={`${letter.char}-${String(index)}`}
              geometry={letterGeometry}
              position={[letter.x, 0, 0]}
              scale={[letter.width, placement.box.height, letterDepth]}
            >
              {faceMaterials(`letter-${String(index)}`)}
            </mesh>
          ))}

      {HALO_KINDS.map((kind, index) => (
        <mesh
          key={kind}
          geometry={haloCellGeometry(kind)}
          visible={false}
          ref={(mesh) => {
            haloMeshesRef.current[index] = mesh
          }}
        >
          <meshBasicMaterial
            ref={(instance) => {
              haloMaterialsRef.current[index] = instance
            }}
            alphaMap={supportShadowTexture()}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh ref={shadowRef} scale={UNIT_BOX}>
        <planeGeometry args={UNIT_PLANE} />
        <meshBasicMaterial
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
