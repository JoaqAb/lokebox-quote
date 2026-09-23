import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
  type ShadowMaterial,
} from 'three'
import { ATTENUATION_LAYER, BLOOM_LAYER } from '../../../core/preview/render'
import type { MaterialVisual, Mount, PhotoLight } from '../../../core/types'
import { haloCellGeometry } from './haloGeometry'
import { SignText3D, type LetterPart } from './SignText3D'
import {
  applyFinish,
  disposeStandoffSurface,
  disposeSurface,
  letterSurface,
  panelSurface,
  repeatSurface,
  standoffSurface,
  type Surface,
  type SurfaceSize,
} from './surfaceMaterials'
import { disposeSurfaceParts, roundedPanelParts } from './surfaceParts'
import { supportShadowTexture } from './supportShadow'
import {
  DAMP_LAMBDA,
  HALO,
  SET,
  STANDOFF,
  SETTLE_EPSILON,
  SIGN_TEXT,
  SUPPORT_SHADOW,
  TOTEM_SHADOW,
  TOTEM_STRUCTURE_METALNESS,
  TOTEM_STRUCTURE_ROUGHNESS,
  UNIT_BOX,
  UNIT_PLANE,
  VISIBLE_EPSILON,
  approach,
  haloBox,
  haloCells,
  haloMargin,
  haloPeak,
  HALO_LETTERS_BAND,
  floorReceiver,
  photoShadowOpacity,
  wallReceiver,
  lettersContour,
  lampPosition,
  lightingParams,
  signModeLightingParams,
  standoffPositions,
  supportShadowBox,
  totemLayout,
  translucentFace,
  type HaloCellKind,
  type LetterBox,
  type SignPlacement,
  type TextBounds,
} from './sceneGeometry'
import type { Typeface } from './typeface'

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
// cartel (SPEC 12, version 1.14), salvo una cara translucida, el acrilico opal, que enciende.
// Desde la version 2.1 son MeshPhysicalMaterial con los parametros fisicos del visual y los
// mapas de su acabado (surfaceMaterials), y panel y letras son dos mallas cada uno, la cara
// y la cascara, para que el bloom tome solo lo que emite: en back la cascara y, si es
// translucida, la cara. La seleccion es la capa BLOOM_LAYER del core. En modo letters el panel se oculta y se dibuja una letra
// corporea por caracter; placement.box es el contorno de la palabra, y halo, sombra y
// lampara lo siguen igual que al panel. En modo area el texto va en relieve sobre la cara,
// con el color del texto y sin emision: es parte de la cara.
// Sombras de mapa (SPEC 12, version 2.0): panel, letras, relieve, poste y base proyectan y
// reciben; halo y sombra de apoyo no, porque son luz y sombra pintadas.
// Version 2.4: el panel tiene los cantos redondeados y se arma a la medida objetivo; con
// mount standoff lleva cuatro separadores y la pared (halo, sombra, luz de back) se aleja.
// En modo vista no hay bloom (D64). El halo es una banda de 0,3 del alto del cartel con el
// perfil en el alpha de sus vertices y el pico de la luz ambiente de la foto (D65); en
// letters rodea la tinta y no los avances.

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
  // Montaje del panel (version 2.4, D68): con standoff van los separadores y la pared se aleja.
  mount: Mount | null
  // Luz de la foto elegida (version 2.5): su ambiente da el pico del halo (D65) y la sombra
  // proyectada pesa la key contra el ambiente (D76). null en modo cartel.
  photoLight: PhotoLight | null
  // Modo letters: el contorno de la tinta, que rodea el halo. null en modo area.
  textBounds: TextBounds | null
}

type Surfaces = { panel: Surface; letter: Surface; relief: Surface }

// Parametros fisicos que se amortiguan con el cartel. El acabado y sus mapas cambian de golpe.
const DAMPED = ['metalness', 'roughness', 'specularIntensity', 'clearcoat', 'clearcoatRoughness', 'anisotropy', 'normalScale'] as const
type Damped = Record<(typeof DAMPED)[number], number>

function setBloom(mesh: Mesh | null, on: boolean): void {
  if (mesh === null) {
    return
  }
  if (on) {
    mesh.layers.enable(BLOOM_LAYER)
  } else {
    mesh.layers.disable(BLOOM_LAYER)
  }
}

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
  mount,
  photoLight,
  textBounds,
}: SignBoardProps) {
  const signRef = useRef<Mesh>(null)
  const shellRef = useRef<Mesh>(null)
  const panelGroupRef = useRef<Group>(null)
  const postRef = useRef<Mesh>(null)
  const baseRef = useRef<Mesh>(null)
  const letterMeshesRef = useRef(new Map<string, { part: LetterPart; mesh: Mesh }>())
  const haloMeshesRef = useRef<(Mesh | null)[]>([])
  const haloMaterialsRef = useRef<(MeshBasicMaterial | null)[]>([])
  const lampRef = useRef<PointLight>(null)
  const shadowRef = useRef<Mesh>(null)
  const standoffRefs = useRef<(Mesh | null)[]>([])
  const wallRef = useRef<Mesh>(null)
  const floorRef = useRef<Mesh>(null)
  const wallMaterialRef = useRef<ShadowMaterial>(null)
  const floorMaterialRef = useRef<ShadowMaterial>(null)
  // Los receptores van solo en la capa de atenuacion del core (version 2.6, D79): la sombra es
  // atenuacion y no pasa por el tone mapping.
  useLayoutEffect(() => {
    wallRef.current?.layers.set(ATTENUATION_LAYER)
    floorRef.current?.layers.set(ATTENUATION_LAYER)
  }, [])
  // Estado amortiguado del material, compartido por todas las caras de todas las cajas.
  const look = useRef({
    color: new Color(),
    physical: { metalness: 0, roughness: 1, specularIntensity: 1, clearcoat: 0, clearcoatRoughness: 0, anisotropy: 0, normalScale: 0 } as Damped,
    width: 0,
    height: 0,
    face: 0,
    edge: 0,
    shade: 0,
    haloOpacity: 0,
    started: false,
  })
  const targetColor = useMemo(() => new Color(material.color), [material.color])
  const reliefColor = useMemo(() => new Color(textColor), [textColor])
  const { width: boxWidth, height: boxHeight } = placement.box
  // El panel redondeado se arma a la medida objetivo (version 2.4): el radio de los cantos va
  // en metros y no sobrevive a un scale. Se libera al cambiar de medida y al desmontar.
  const parts = useMemo(() => roundedPanelParts(boxWidth, boxHeight, SET.sign.thickness), [boxWidth, boxHeight])
  useEffect(
    () => () => {
      disposeSurfaceParts(parts)
    },
    [parts],
  )
  const standoff = useMemo(() => {
    const geometry = new CylinderGeometry(STANDOFF.diameter / 2, STANDOFF.diameter / 2, STANDOFF.wallGap, STANDOFF.radialSegments)
    // El eje del cilindro va de la cara trasera del panel a la pared.
    geometry.rotateX(Math.PI / 2)
    return { geometry, surface: standoffSurface() }
  }, [])
  useEffect(
    () => () => {
      standoff.geometry.dispose()
      disposeStandoffSurface(standoff.surface)
    },
    [standoff],
  )
  // Los materiales de las tres superficies viven lo que vive el cartel.
  const surfaces = useMemo(
    (): Surfaces => ({ panel: panelSurface(), letter: letterSurface(), relief: letterSurface() }),
    [],
  )
  useEffect(
    () => () => {
      disposeSurface(surfaces.panel)
      disposeSurface(surfaces.letter)
      disposeSurface(surfaces.relief)
    },
    [surfaces],
  )

  function onLetterMesh(key: string, part: LetterPart, mesh: Mesh | null): void {
    const id = `${key}-${part}`
    if (mesh === null) {
      letterMeshesRef.current.delete(id)
    } else {
      letterMeshesRef.current.set(id, { part, mesh })
    }
  }

  useFrame((_state, delta) => {
    const sign = signRef.current
    const shell = shellRef.current
    const lamp = lampRef.current
    const shadow = shadowRef.current
    const panelGroup = panelGroupRef.current
    const post = postRef.current
    const base = baseRef.current
    if (sign === null || shell === null || lamp === null || shadow === null || panelGroup === null || post === null || base === null) {
      return
    }

    const lighting = signMode ? signModeLightingParams(lightingMode) : lightingParams(lightingMode)
    const face = translucentFace(lighting, material.translucency)
    const lampTarget = lampPosition(lightingMode, placement, mount)
    const state = look.current

    // El primer frame se acomoda de golpe, para no entrar con una animacion de carga.
    const instant = reducedMotion || !state.started
    state.started = true
    const move = (current: number, target: number): number =>
      instant ? target : approach(current, target, delta)

    // La geometria mide el objetivo: durante la transicion el scale la estira hasta la medida
    // amortiguada, y al llegar vale 1.
    state.width = move(state.width, placement.box.width)
    state.height = move(state.height, placement.box.height)
    sign.scale.set(state.width / placement.box.width, state.height / placement.box.height, 1)
    sign.visible = letters === null
    shell.scale.copy(sign.scale)
    shell.visible = sign.visible
    const standoffs = standoffPositions({ width: state.width, height: state.height })
    standoffRefs.current.forEach((mesh, index) => {
      if (mesh !== null) {
        mesh.visible = sign.visible && mount === 'standoff'
        mesh.position.set(...standoffs[index])
      }
    })

    if (instant) {
      state.color.copy(targetColor)
    } else {
      approachColor(state.color, targetColor, delta)
    }
    for (const key of DAMPED) {
      state.physical[key] = move(state.physical[key], material[key])
    }
    state.face = move(state.face, face.faceEmissiveIntensity)
    state.edge = move(state.edge, lighting.edgeEmissiveIntensity)
    state.shade = move(state.shade, face.faceShade)
    // El totem es exento y no tiene halo en vista (version 2.6, D80): no hay pared a la distancia
    // de montaje, y su halo caia sobre el vidrio de la vidriera.
    const haloTarget = photoLight === null || totem ? 0 : haloPeak(photoLight.ambient)
    state.haloOpacity = move(state.haloOpacity, lighting.haloOpacity * haloTarget)

    // Medidas de cada superficie, para repetir los mapas por metro.
    const sizes: Record<keyof Surfaces, SurfaceSize> = {
      panel: { width: state.width, height: state.height, depth: SET.sign.thickness },
      letter: { width: placement.box.height, height: placement.box.height, depth: letterDepth },
      relief: { width: relief?.scale ?? 0, height: relief?.scale ?? 0, depth: SIGN_TEXT.reliefDepth },
    }
    for (const kind of ['panel', 'letter', 'relief'] as const) {
      const surface = surfaces[kind]
      applyFinish(surface, material.finish)
      repeatSurface(surface, sizes[kind])
      surface.materials.forEach((physical, index) => {
        physical.metalness = state.physical.metalness
        physical.roughness = state.physical.roughness
        physical.specularIntensity = state.physical.specularIntensity
        physical.clearcoat = state.physical.clearcoat
        physical.clearcoatRoughness = state.physical.clearcoatRoughness
        physical.anisotropy = state.physical.anisotropy
        physical.normalScale.setScalar(state.physical.normalScale)
        // El relieve es parte de la cara: color del texto y sin emision.
        if (kind === 'relief') {
          physical.color.copy(reliefColor)
          physical.emissiveIntensity = 0
          return
        }
        const front = surface.slots[index].front
        physical.color.copy(state.color)
        if (front) {
          physical.color.multiplyScalar(1 - state.shade)
        }
        physical.emissive.copy(state.color)
        physical.emissiveIntensity = front ? state.face : state.edge
      })
    }

    // Seleccion del bloom: en back la cascara, y la cara si es translucida. El relieve nunca.
    // En modo vista nada (version 2.4, D64): el bloom es de pantalla y se derrama sobre lo que
    // la foto tenga al lado del cartel. Ahi la luz de afuera es solo el halo.
    const bloomShell = lighting.emitters && signMode
    const bloomFace = bloomShell && material.translucency > 0
    setBloom(shell, bloomShell)
    setBloom(sign, bloomFace)
    for (const { part, mesh } of letterMeshesRef.current.values()) {
      setBloom(mesh, part === 'shell' ? bloomShell : bloomFace)
    }

    // El halo sigue al tamano amortiguado del cartel, no al objetivo: asi no se adelanta.
    // En letters el halo rodea la tinta, con su propia banda en fraccion del alto de letra (D75).
    const lettersMode = letters !== null && textBounds !== null
    const contour = lettersMode
      ? lettersContour(textBounds, state.height)
      : { box: { width: state.width, height: state.height }, center: [0, 0] }
    const band = lettersMode ? state.height * HALO_LETTERS_BAND : haloMargin({ box: { width: state.width, height: state.height } })
    const cells = haloCells({ box: contour.box }, band)
    const haloZ = haloBox(placement, mount).z
    const haloVisible = state.haloOpacity > VISIBLE_EPSILON
    cells.forEach((cell, index) => {
      const mesh = haloMeshesRef.current[index]
      const haloMaterial = haloMaterialsRef.current[index]
      if (mesh === null || mesh === undefined || haloMaterial === null || haloMaterial === undefined) {
        return
      }
      mesh.position.set(contour.center[0] + cell.position[0], contour.center[1] + cell.position[1], haloZ)
      mesh.scale.set(cell.size[0], cell.size[1], 1)
      mesh.visible = haloVisible
      haloMaterial.color.copy(state.color).multiplyScalar(HALO.radiance)
      haloMaterial.opacity = state.haloOpacity
    })

    // Receptores de la sombra proyectada, solo en modo vista (version 2.5, D76): la pared detras
    // del contorno en fachada y letters, el piso bajo la base en el totem.
    const wall = wallRef.current
    const floor = floorRef.current
    const shadowOpacity = photoLight === null ? 0 : photoShadowOpacity(photoLight)
    if (wall !== null && floor !== null) {
      wall.visible = shadowOpacity > 0 && !totem
      floor.visible = shadowOpacity > 0 && totem
      const receiver = wallReceiver(contour.box, mount)
      wall.position.set(contour.center[0], contour.center[1], receiver.z)
      wall.scale.set(receiver.size[0], receiver.size[1], 1)
      if (totem) {
        const [floorWidth, floorDepth] = floorReceiver(totemLayout({ width: state.width, height: state.height }).volume).size
        floor.scale.set(floorWidth, floorDepth, 1)
      }
      for (const material of [wallMaterialRef.current, floorMaterialRef.current]) {
        if (material !== null) {
          material.opacity = shadowOpacity
        }
      }
    }

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
    const totemParts = totem ? totemLayout({ width: state.width, height: state.height }) : null
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
    const shadowTarget = supportShadowBox(placement, mount)
    shadow.scale.x = move(shadow.scale.x, shadowTarget.size[0])
    shadow.scale.y = move(shadow.scale.y, shadowTarget.size[1])
    shadow.position.y = move(shadow.position.y, shadowTarget.position[1])
    shadow.position.z = shadowTarget.position[2]
  })

  return (
    <group>
      <group ref={panelGroupRef}>
        <mesh ref={signRef} geometry={parts.face} material={surfaces.panel.materials} castShadow receiveShadow />
        <mesh ref={shellRef} geometry={parts.shell} material={surfaces.panel.materials} castShadow receiveShadow />

        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            geometry={standoff.geometry}
            material={standoff.surface.material}
            visible={false}
            castShadow
            receiveShadow
            ref={(mesh) => {
              standoffRefs.current[index] = mesh
            }}
          />
        ))}

        {typeface !== null && letters !== null ? (
          <SignText3D
            typeface={typeface}
            letters={letters}
            height={placement.box.height}
            depth={letterDepth}
            position={[0, 0, 0]}
            owner="letter"
            kind="letter"
            materials={surfaces.letter.materials}
            onMesh={onLetterMesh}
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
            kind="relief"
            materials={surfaces.relief.materials}
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
              vertexColors
              side={DoubleSide}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}

        <mesh ref={wallRef} visible={false} receiveShadow>
          <planeGeometry args={UNIT_PLANE} />
          <shadowMaterial ref={wallMaterialRef} transparent opacity={0} depthWrite={false} />
        </mesh>

        <pointLight ref={lampRef} />
      </group>

      <mesh ref={floorRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, TOTEM_SHADOW.lift / 2, 0]} receiveShadow>
        <planeGeometry args={UNIT_PLANE} />
        <shadowMaterial ref={floorMaterialRef} transparent opacity={0} depthWrite={false} />
      </mesh>

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
