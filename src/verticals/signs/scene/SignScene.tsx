import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import type { ClientPhoto, MaterialVisual, PhotoGroundAnchor } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { StudioEnvironment } from './StudioEnvironment'
import {
  SET,
  SIGN_STUDIO_LIGHT,
  SIGN_VIEW,
  STUDIO_SHADOW,
  approach,
  fitTextOnPanel,
  layoutLetters,
  lensShift,
  lettersFrameVolume,
  totemLayout,
  orbitPosition,
  photoCameraDistance,
  signFrameDistance,
  studioShadowReach,
  type LetterBox,
  type ScenePalette,
  type SignPlacement,
  type SignVolume,
  type Vec3,
} from './sceneGeometry'
import { glyphAdvance, textBounds, type Typeface } from './typeface'

// Contenido del canvas: camara en perspectiva, la luz, el cartel y el texto de su cara
// (SPEC 12, version 1.13). El cartel queda siempre en el origen y sin rotar; lo que cambia
// entre los dos modos del viewer es la camara y de donde sale la luz.
// - Modo cartel (photo null): fov fijo, OrbitControls con azimut libre y polar acotado,
//   distancia derivada en cada frame de la huella de la caja, el zoom la multiplica, y la
//   luz es la de estudio del producto.
// - Modo vista: la camara sale del anchor de la foto y el centro del cartel cae en su
//   (x, y) con setViewOffset. Sin orbita; el zoom de este modo es CSS, fuera del canvas.
// Version 2.0: el HDRI y el typeface suspenden en el Suspense del canvas del core, que muestra
// la pantalla de carga; si alguno falta, la escena sigue sin reflejo o sin texto. En modo
// cartel la key proyecta sombra de mapa sobre el propio cartel: el relieve sobre la cara, el
// panel sobre el poste. En modo vista no proyecta: la foto tiene su propia luz.

// Ruta del paquete de assets de TAREA_011 (Poly Haven, Studio Small 08, CC0).
export const HDRI_SRC = '/assets/quote/hdri/studio-small-08-256.hdr'

type SignSceneProps = {
  placement: SignPlacement
  material: MaterialVisual
  lightingMode: string
  text: string
  palette: ScenePalette
  // null en modo cartel.
  photo: ClientPhoto | null
  // Multiplicador de la distancia del modo cartel, entre SIGN_VIEW.nearFactor y 1.
  signZoom: number
  reducedMotion: boolean
  // Modo letters: las letras en alto de mayuscula 1, null en modo area.
  letters: LetterBox[] | null
  // null hasta que carga el typeface, o si no carga: el cartel se dibuja sin texto.
  typeface: Typeface | null
  letterDepth: number
  // Tipo totem: panel sobre poste y base, con el origen en el piso.
  totem: boolean
  structureColor: string
}

type ViewerCameraProps = {
  volume: SignVolume
  // Centro de la caja de encuadre: target del modo cartel. El cartel lo tiene en el origen y
  // el totem, cuyo origen es el piso, a media altura.
  center: Vec3
  photo: ClientPhoto | null
  // Modo vista con totem: el anclaje de piso de la foto, que da distancia y corrimiento.
  ground: PhotoGroundAnchor | null
  signZoom: number
  reducedMotion: boolean
}

function ViewerCamera({ volume, center, photo, ground, signZoom, reducedMotion }: ViewerCameraProps) {
  const cameraRef = useRef<PerspectiveCameraImpl>(null)
  // Distancia aplicada en el frame anterior; null al entrar al modo cartel, que va de golpe.
  const distanceRef = useRef<number | null>(null)
  const direction = useMemo(() => new Vector3(), [])
  const [cx, cy, cz] = center
  const target = useMemo(() => new Vector3(cx, cy, cz), [cx, cy, cz])
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height

  // Modo vista: angulos y fov salen del anchor, que describe la camara. Distancia y
  // corrimiento salen del anchor o, con totem, del anclaje de piso; el punto que cae en
  // (x, y) es el origen: el centro del cartel o el apoyo de la base. Se recalcula con el
  // tamano del canvas porque el corrimiento va en pixeles.
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || photo === null) {
      return
    }
    const { anchor } = photo
    const placement = ground ?? anchor
    const distance = photoCameraDistance(placement.metersToWidth, anchor.fovDeg, aspect)
    camera.fov = anchor.fovDeg
    camera.position.set(...orbitPosition(anchor.cameraYawDeg, anchor.cameraPitchDeg, distance))
    camera.lookAt(0, 0, 0)
    const [offsetX, offsetY] = lensShift(placement.x, placement.y, size.width, size.height)
    camera.setViewOffset(size.width, size.height, offsetX, offsetY, size.width, size.height)
    camera.updateProjectionMatrix()
  }, [photo, ground, aspect, size.width, size.height])

  // Modo cartel al entrar: de frente, apenas por encima. Posicion y distancia las pone el
  // primer frame, que conoce el target. Depende solo de si hay foto: cambiar el cartel o el
  // tipo no le devuelve el azimut al frente.
  const signMode = photo === null
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || !signMode) {
      return
    }
    camera.clearViewOffset()
    camera.fov = SIGN_VIEW.fovDeg
    camera.updateProjectionMatrix()
    distanceRef.current = null
  }, [signMode])

  // Modo cartel: en cada frame, la distancia que encuadra la huella de la caja desde la
  // orientacion actual, por el zoom, con damp. Solo cambia el largo del vector: el azimut
  // y el polar son los que dejo OrbitControls, que actualiza antes en el mismo frame.
  useFrame((_state, delta) => {
    const camera = cameraRef.current
    if (camera === null || !signMode) {
      return
    }
    const current = distanceRef.current
    if (current === null) {
      direction.set(...orbitPosition(0, 90 - MathUtils.radToDeg(SIGN_VIEW.startPolar), 1))
    } else {
      direction.copy(camera.position).sub(target).normalize()
    }
    const wanted = signFrameDistance(volume, [direction.x, direction.y, direction.z], aspect) * signZoom
    const next = current === null || reducedMotion ? wanted : approach(current, wanted, delta)
    camera.position.copy(direction.multiplyScalar(next).add(target))
    if (current === null) {
      camera.lookAt(target)
    }
    distanceRef.current = next
  })

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={SIGN_VIEW.fovDeg}
        near={SIGN_VIEW.near}
        far={SIGN_VIEW.far}
      />
      {signMode ? (
        <OrbitControls
          target={center}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={SIGN_VIEW.minPolar}
          maxPolarAngle={SIGN_VIEW.maxPolar}
        />
      ) : null}
    </>
  )
}

export function SignScene({
  placement,
  material,
  lightingMode,
  text,
  palette,
  photo,
  signZoom,
  reducedMotion,
  letters,
  letterDepth,
  typeface,
  totem,
  structureColor,
}: SignSceneProps) {
  // En modo vista la luz viene de la foto: cada foto dice de donde le pega el sol, para que
  // el volumen del cartel case con ella. En modo cartel es la luz de estudio del producto.
  const light = photo === null ? SIGN_STUDIO_LIGHT : photo.light
  const keyPosition = useMemo((): [number, number, number] => {
    const az = MathUtils.degToRad(light.keyAzimuthDeg)
    const el = MathUtils.degToRad(light.keyElevationDeg)
    const r = 10
    return [r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el)]
  }, [light])
  const { width, height } = placement.box

  // Contorno real del texto con el typeface: encuadra las letras y escala el relieve.
  const bounds = useMemo(() => (typeface === null ? null : textBounds(typeface, text)), [typeface, text])
  // Caja de encuadre y su centro: la del cartel en el origen, o la del totem completo.
  const frame = useMemo((): { volume: SignVolume; center: Vec3 } => {
    if (letters !== null) {
      return { volume: lettersFrameVolume(bounds, height, letterDepth), center: [0, 0, 0] }
    }
    if (totem) {
      const layout = totemLayout({ width, height })
      return { volume: layout.volume, center: layout.center }
    }
    return { volume: { width, height, depth: SET.sign.thickness }, center: [0, 0, 0] }
  }, [letters, totem, bounds, width, height, letterDepth])
  const ground = totem && photo !== null ? (photo.anchorGround ?? null) : null
  const shadowReach = studioShadowReach(frame.volume, frame.center)
  const relief = useMemo(() => {
    if (typeface === null || letters !== null || bounds === null) {
      return null
    }
    const layout = layoutLetters(text, 1, (char) => glyphAdvance(typeface, char))
    return { letters: layout.boxes, ...fitTextOnPanel(bounds, { width, height }) }
  }, [typeface, letters, bounds, text, width, height])

  return (
    <>
      <ViewerCamera
        volume={frame.volume}
        center={frame.center}
        photo={photo}
        ground={ground}
        signZoom={signZoom}
        reducedMotion={reducedMotion}
      />

      <ambientLight intensity={light.ambient} />
      <directionalLight
        position={keyPosition}
        intensity={light.keyIntensity}
        castShadow={photo === null}
        shadow-mapSize={[STUDIO_SHADOW.mapSize, STUDIO_SHADOW.mapSize]}
        shadow-bias={STUDIO_SHADOW.bias}
        shadow-normalBias={STUDIO_SHADOW.normalBias}
        shadow-radius={STUDIO_SHADOW.radius}
        shadow-camera-left={-shadowReach}
        shadow-camera-right={shadowReach}
        shadow-camera-top={shadowReach}
        shadow-camera-bottom={-shadowReach}
        shadow-camera-near={STUDIO_SHADOW.near}
        shadow-camera-far={STUDIO_SHADOW.far}
      />
      <StudioEnvironment src={HDRI_SRC} />

      <SignBoard
        placement={placement}
        material={material}
        lightingMode={lightingMode}
        shadowColor={palette.shadow}
        reducedMotion={reducedMotion}
        typeface={typeface}
        letters={letters}
        letterDepth={letterDepth}
        relief={relief}
        textColor={palette.signText}
        totem={totem && letters === null}
        structureColor={structureColor}
        signMode={photo === null}
      />
    </>
  )
}
