import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Vector3, type DirectionalLight, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { ATTENUATION_LAYER } from '../../../core/preview/render'
import type { ClientPhoto, MaterialVisual, Mount, PhotoGroundAnchor } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { StudioEnvironment } from '../../../core/preview/StudioEnvironment'
import {
  SET,
  SIGN_STUDIO_BRIGHT,
  SIGN_STUDIO_LIGHT,
  SIGN_VIEW,
  STUDIO_SHADOW,
  approach,
  fitTextOnPanel,
  layoutLetters,
  lettersFrameVolume,
  totemLayout,
  orbitPosition,
  photoCameraPose,
  groundPointAt,
  photoShadowVolume,
  tintedLightColor,
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
//   (x, y); desde 2.6 (D81) por la posicion de la camara, fuera del eje, y no con setViewOffset.
//   Sin orbita; el zoom de este modo es CSS, fuera del canvas.
// Version 2.0: el typeface suspende en el Suspense del canvas del core, que muestra la
// pantalla de carga; si falta, la escena sigue sin texto. Desde 2.2 (D55) el reflejo sale del
// entorno de estudio que genera el core: en modo cartel a intensidad plena y en modo vista
// escalado por la luz ambiente de la foto, que sigue mandando, con la fuente especular en la
// direccion de la key de la foto (2.3, D61). En modo
// cartel la key proyecta sombra de mapa sobre el propio cartel: el relieve sobre la cara, el
// panel sobre el poste. Desde 2.5 (D76) en modo vista tambien proyecta, con la direccion de la
// key de la foto, sobre el receptor de solo sombra de SignBoard; y ambiente y key llevan el
// tinte de la foto alrededor del anclaje (D77).

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
  // Montaje del panel (version 2.4, D68). null en letters.
  mount: Mount | null
  structureColor: string
  // Tinte de la foto elegida alrededor del anclaje (version 2.5, D77), luminancia 1. null en
  // modo cartel o mientras la foto no cargo.
  tint: [number, number, number] | null
}

type ViewerCameraProps = {
  volume: SignVolume
  // Centro de la caja de encuadre: target del modo cartel. El cartel lo tiene en el origen y
  // el totem, cuyo origen es el piso, a media altura.
  center: Vec3
  photo: ClientPhoto | null
  // Modo vista con totem: el anclaje de piso de la foto, que da la escala y el punto de apoyo.
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

  // Modo vista (version 2.6, D81): orientacion y fov salen del anchor, que describe la camara, y la
  // camara se ubica para que el origen caiga en (x, y) fuera del eje: el centro del cartel, o con
  // totem el apoyo de la base, con la escala del anclaje de piso. Sin corrimiento de la vista. Se
  // recalcula con el aspecto del canvas.
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || photo === null) {
      return
    }
    const { anchor } = photo
    const pose = photoCameraPose(ground ?? anchor, { yawDeg: anchor.cameraYawDeg, pitchDeg: anchor.cameraPitchDeg }, anchor.fovDeg, aspect)
    camera.fov = anchor.fovDeg
    camera.clearViewOffset()
    camera.position.set(...pose.position)
    camera.lookAt(...pose.target)
    camera.updateProjectionMatrix()
  }, [photo, ground, aspect])

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
  mount,
  structureColor,
  tint,
}: SignSceneProps) {
  // En modo vista la luz viene de la foto: cada foto dice de donde le pega el sol, para que
  // el volumen del cartel case con ella. En modo cartel es la luz de estudio del producto: con
  // el cartel apagado, el estudio con las luces prendidas (D104); encendido, el de siempre (D105).
  const studioBright = photo === null && lightingMode === 'none'
  const light = photo !== null ? photo.light : studioBright ? SIGN_STUDIO_BRIGHT.light : SIGN_STUDIO_LIGHT
  const keyPosition = useMemo((): [number, number, number] => {
    const az = MathUtils.degToRad(light.keyAzimuthDeg)
    const el = MathUtils.degToRad(light.keyElevationDeg)
    const r = 10
    return [r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el)]
  }, [light])
  // Modo vista: la fuente especular del estudio sale de la key de la foto (D61), asi el
  // brillo cae donde esta el sol de esa foto y el dato viene del JSON.
  const studioHighlight = useMemo(
    () => ({ azimuthDeg: light.keyAzimuthDeg, elevationDeg: light.keyElevationDeg }),
    [light],
  )
  const { width, height } = placement.box
  // La key tambien va en la capa de atenuacion (version 2.6, D79): three solo cuenta las luces de
  // las capas que dibuja la camara, y los receptores de la sombra se dibujan solos en esa capa.
  const keyRef = useRef<DirectionalLight>(null)
  useLayoutEffect(() => {
    keyRef.current?.layers.enable(ATTENUATION_LAYER)
  }, [])

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
  // Totem en vista (version 2.7, D85): donde la camara ve la linea de fachada sobre el piso, en la
  // columna del apoyo. El receptor de piso termina ahi.
  const canvasSize = useThree((state) => state.size)
  const canvasAspect = canvasSize.width / canvasSize.height
  const floorWallZ = useMemo(() => {
    if (photo === null || ground === null) {
      return null
    }
    const { anchor } = photo
    const pose = photoCameraPose(ground, { yawDeg: anchor.cameraYawDeg, pitchDeg: anchor.cameraPitchDeg }, anchor.fovDeg, canvasAspect)
    const point = groundPointAt(pose, anchor.fovDeg, canvasAspect, ground.x, ground.wallY)
    return point === null ? null : point[2]
  }, [photo, ground, canvasAspect])
  // La camara de sombra cubre el cartel en modo cartel y, en modo vista, tambien el receptor de
  // la sombra proyectada (version 2.5, D76).
  const shadowReach = studioShadowReach(photo === null ? frame.volume : photoShadowVolume(frame.volume, totem && letters === null), frame.center)
  // Modo vista: ambiente y key se tinen con el color de la foto (D77). Modo cartel: blanco.
  // El entorno de estudio es la parte del ambiente que refleja: en vista lleva el mismo tinte.
  const lightTint = useMemo(() => tintedLightColor(photo === null ? null : tint), [photo, tint])
  const lightColor = useMemo(() => new Color(...lightTint), [lightTint])
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

      <ambientLight intensity={light.ambient} color={lightColor} />
      <directionalLight
        ref={keyRef}
        position={keyPosition}
        intensity={light.keyIntensity}
        color={lightColor}
        castShadow
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
      <StudioEnvironment
        intensity={photo !== null ? light.ambient : studioBright ? SIGN_STUDIO_BRIGHT.environment : 1}
        highlight={photo === null ? null : studioHighlight}
        color={lightTint}
      />

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
        mount={mount}
        photoLight={photo === null ? null : photo.light}
        textBounds={letters === null ? null : bounds}
        floorWallZ={floorWallZ}
      />
    </>
  )
}
