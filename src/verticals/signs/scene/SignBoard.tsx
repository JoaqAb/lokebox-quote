import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, MathUtils, type Mesh, type MeshStandardMaterial } from 'three'
import type { MaterialVisual } from '../../../core/types'
import {
  DAMP_LAMBDA,
  SET,
  SETTLE_EPSILON,
  UNIT_BOX,
  WINDOW_TOP,
  type SignBox,
  type Vec3,
} from './sceneGeometry'

// El cartel. Una sola boxGeometry unitaria creada una vez: el tamano se aplica con scale
// y la transicion la hace damp en useFrame. La geometria nunca se recrea.
// Ni el tamano ni el color viajan como props de JSX: los maneja el frame loop, asi
// un cambio de slider no pisa la transicion.

const INITIAL_POSITION: Vec3 = [0, WINDOW_TOP + SET.sign.gapOverWindow, SET.sign.z]

// TAREA_003 deja el cartel sin emision. Los modos de luz son TAREA_004.
const EMISSIVE_OFF = new Color(0, 0, 0)

// Damp que cierra exacto: sin esto el valor final nunca es el del JSON.
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
  box: SignBox
  material: MaterialVisual
  reducedMotion: boolean
}

export function SignBoard({ box, material, reducedMotion }: SignBoardProps) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const started = useRef(false)
  const targetColor = useMemo(() => new Color(material.color), [material.color])

  useFrame((_state, delta) => {
    const mesh = meshRef.current
    const meshMaterial = materialRef.current
    if (mesh === null || meshMaterial === null) {
      return
    }

    // El primer frame se acomoda de golpe, para no entrar con una animacion de carga.
    const instant = reducedMotion || !started.current
    started.current = true

    if (instant) {
      mesh.scale.set(box.width, box.height, SET.sign.thickness)
      mesh.position.y = box.centerY
      meshMaterial.color.copy(targetColor)
      meshMaterial.metalness = material.metalness
      meshMaterial.roughness = material.roughness
      return
    }

    mesh.scale.x = approach(mesh.scale.x, box.width, delta)
    mesh.scale.y = approach(mesh.scale.y, box.height, delta)
    mesh.scale.z = SET.sign.thickness
    mesh.position.y = approach(mesh.position.y, box.centerY, delta)
    approachColor(meshMaterial.color, targetColor, delta)
    meshMaterial.metalness = approach(meshMaterial.metalness, material.metalness, delta)
    meshMaterial.roughness = approach(meshMaterial.roughness, material.roughness, delta)
  })

  return (
    <mesh ref={meshRef} position={INITIAL_POSITION} scale={UNIT_BOX}>
      <boxGeometry args={UNIT_BOX} />
      <meshStandardMaterial ref={materialRef} emissive={EMISSIVE_OFF} />
    </mesh>
  )
}
