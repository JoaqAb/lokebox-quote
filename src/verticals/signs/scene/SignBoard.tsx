import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  Color,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
} from 'three'
import type { MaterialVisual } from '../../../core/types'
import { haloCellGeometry } from './haloGeometry'
import { SignText3D } from './SignText3D'
import { supportShadowTexture } from './supportShadow'
import {
  DAMP_LAMBDA,
  SET,
  SETTLE_EPSILON,
  SIGN_TEXT,
  SUPPORT_SHADOW,
  TOTEM_STRUCTURE_METALNESS,
  TOTEM_STRUCTURE_ROUGHNESS,
  UNIT_BOX,
  UNIT_PLANE,
  VISIBLE_EPSILON,
  approach,
  haloBox,
  haloCells,
  lampPosition,
  lightingParams,
  signModeLightingParams,
  supportShadowBox,
  totemLayout,
  type HaloCellKind,
  type LetterBox,
  type SignPlacement,
} from './sceneGeometry'
import { TEXT_FACE, type Typeface } from './typeface'

// El conjunto entero: cartel, texto 3D, halo, sombra de apoyo y la unica luz dinamica, con
// un solo useFrame. Repartirlos los deja desincronizados durante las transiciones de medida.
// Ninguna medida ni ningun color se escribe aca: todo sale de sceneGeometry y del visual.
// Nada viaja como prop de JSX si lo maneja el frame loop: React lo aplicaria de una
// en cada cambio de opcion y pisaria la transicion.
// El cartel esta centrado en el origen y no rota: la camara orbita a su alrededor
// (SPEC 12, version 1.12).
// El panel lleva seis materiales, uno por cara, en el orden de BoxGeometry: +x, -x, +y,
// -y, frente, atras. Cada letra lleva tres, en el orden de TEXT_FACE. Asi en back emiten
// los cantos y la cara trasera, y la cara frontal emite poco en modo vista y nada en modo
// cartel (SPEC 12, version 1.14). En modo letters el panel se oculta y se dibuja una letra
// corporea por caracter; placement.box es el contorno de la palabra, y halo, sombra y
// lampara lo siguen igual que al panel. En modo area el texto va en relieve sobre la cara,
// con el color del texto y sin emision: es parte de la cara.
// Sombras de mapa (SPEC 12, version 2.0): panel, letras, relieve, poste y base proyectan y
// reciben; halo y sombra de apoyo no, porque son luz y sombra pintadas.

const PANEL_FACES = { count: 6, front: 4 }
const LETTER_FACES = { count: 3, front: TEXT_FACE.front }

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
  // Sin el typeface el cartel se dibuja igual, sin texto.
  typeface: Typeface | null
  // Modo letters: las letras en alto de mayuscula 1, null en modo area.
  letters: LetterBox[] | null
  // Profundidad de las letras, en metros.
  letterDepth: number
  // Modo area: el relieve de la cara ya escalado y centrado, null en modo letters.
  relief: { letters: LetterBox[]; scale: number; x: number; y: number } | null
  textColor: string
  // Tipo totem: el panel sube sobre poste y base, y la sombra va al piso.
  totem: boolean
  structureColor: string
  // Modo cartel: sin halo y, en back, la cara apagada.
  signMode: boolean
}

type FaceMaterial = { material: MeshStandardMaterial; front: boolean; relief: boolean }

export function SignBoard({
  placement,
  material,
  lightingMode,
  shadowColor,
  reducedMotion,
  typeface,
  letters,
  letterDepth,
  relief,
  textColor,
  totem,
  structureColor,
  signMode,
}: SignBoardProps) {
  const signRef = useRef<Mesh>(null)
  const panelGroupRef = useRef<Group>(null)
  const postRef = useRef<Mesh>(null)
  const baseRef = useRef<Mesh>(null)
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
    shade: 0,
    haloOpacity: 0,
    started: false,
  })
  const targetColor = useMemo(() => new Color(material.color), [material.color])
  const reliefColor = useMemo(() => new Color(textColor), [textColor])

  function faceMaterials(owner: string, faces: { count: number; front: number }, isRelief: boolean) {
    return Array.from({ length: faces.count }, (_unused, index) => {
      const key = `${owner}-${String(index)}`
      return (
        <meshStandardMaterial
          key={key}
          attach={`material-${String(index)}`}
          ref={(instance) => {
            if (instance === null) {
              faceMaterialsRef.current.delete(key)
            } else {
              faceMaterialsRef.current.set(key, { material: instance, front: index === faces.front, relief: isRelief })
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
    const panelGroup = panelGroupRef.current
    const post = postRef.current
    const base = baseRef.current
    if (sign === null || lamp === null || shadow === null || panelGroup === null || post === null || base === null) {
      return
    }

    const lighting = signMode ? signModeLightingParams(lightingMode) : lightingParams(lightingMode)
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
    state.shade = move(state.shade, lighting.faceShade)
    state.haloOpacity = move(state.haloOpacity, lighting.haloOpacity)

    for (const { material: face, front, relief: isRelief } of faceMaterialsRef.current.values()) {
      face.metalness = state.metalness
      face.roughness = state.roughness
      if (isRelief) {
        face.color.copy(reliefColor)
        face.emissiveIntensity = 0
        continue
      }
      face.color.copy(state.color)
      if (front) {
        face.color.multiplyScalar(1 - state.shade)
      }
      face.emissive.copy(state.color)
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

    // Totem (SPEC 12, version 1.15): poste y base siguen al ancho amortiguado del panel, el
    // panel sube a su altura sobre el piso y la sombra se acuesta bajo la base. Poste y base
    // no emiten nunca: su material no pasa por el loop de caras.
    const totemParts = totem ? totemLayout({ width: sign.scale.x, height: sign.scale.y }) : null
    post.visible = totemParts !== null
    base.visible = totemParts !== null
    panelGroup.position.y = totemParts === null ? 0 : totemParts.panelY
    if (totemParts !== null) {
      post.scale.set(...totemParts.post.size)
      post.position.set(...totemParts.post.position)
      base.scale.set(...totemParts.base.size)
      base.position.set(...totemParts.base.position)
      shadow.rotation.x = -Math.PI / 2
      shadow.scale.x = totemParts.shadow.size[0]
      shadow.scale.y = totemParts.shadow.size[2]
      shadow.position.set(...totemParts.shadow.position)
      return
    }

    // La sombra de apoyo sigue al cartel: es lo que impide que flote.
    shadow.rotation.x = 0
    const shadowTarget = supportShadowBox(placement)
    shadow.scale.x = move(shadow.scale.x, shadowTarget.size[0])
    shadow.scale.y = move(shadow.scale.y, shadowTarget.size[1])
    shadow.position.y = move(shadow.position.y, shadowTarget.position[1])
    shadow.position.z = shadowTarget.position[2]
  })

  return (
    <group>
      <group ref={panelGroupRef}>
        <mesh ref={signRef} scale={UNIT_BOX} castShadow receiveShadow>
          <boxGeometry args={UNIT_BOX} />
          {faceMaterials('panel', PANEL_FACES, false)}
        </mesh>

        {typeface !== null && letters !== null ? (
          <SignText3D
            typeface={typeface}
            letters={letters}
            height={placement.box.height}
            depth={letterDepth}
            position={[0, 0, 0]}
            owner="letter"
            materials={(owner) => faceMaterials(owner, LETTER_FACES, false)}
          />
        ) : null}

        {typeface !== null && relief !== null ? (
          <SignText3D
            typeface={typeface}
            letters={relief.letters}
            height={relief.scale}
            depth={SIGN_TEXT.reliefDepth}
            position={[relief.x, relief.y, SET.sign.thickness / 2 + SIGN_TEXT.reliefDepth / 2]}
            owner="relief"
            materials={(owner) => faceMaterials(owner, LETTER_FACES, true)}
          />
        ) : null}

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

        <pointLight ref={lampRef} />
      </group>

      <mesh ref={postRef} visible={false} castShadow receiveShadow>
        <boxGeometry args={UNIT_BOX} />
        <meshStandardMaterial color={structureColor} metalness={TOTEM_STRUCTURE_METALNESS} roughness={TOTEM_STRUCTURE_ROUGHNESS} />
      </mesh>
      <mesh ref={baseRef} visible={false} castShadow receiveShadow>
        <boxGeometry args={UNIT_BOX} />
        <meshStandardMaterial color={structureColor} metalness={TOTEM_STRUCTURE_METALNESS} roughness={TOTEM_STRUCTURE_ROUGHNESS} />
      </mesh>

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
    </group>
  )
}
