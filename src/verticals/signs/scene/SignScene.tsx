import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import type { ClientPhoto, MaterialVisual } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { LetterFaces, SignFace } from './SignFace'
import { StudioEnvironment } from './StudioEnvironment'
import {
  SET,
  SIGN_STUDIO_LIGHT,
  SIGN_VIEW,
  approach,
  lensShift,
  orbitPosition,
  photoCameraDistance,
  signFrameDistance,
  type LetterBox,
  type ScenePalette,
  type SignPlacement,
  type SignVolume,
} from './sceneGeometry'

// Contenido del canvas: camara en perspectiva, la luz, el cartel y el texto de su cara
// (SPEC 12, version 1.13). El cartel queda siempre en el origen y sin rotar; lo que cambia
// entre los dos modos del viewer es la camara y de donde sale la luz.
// - Modo cartel (photo null): fov fijo, OrbitControls con azimut libre y polar acotado,
//   distancia derivada en cada frame de la huella de la caja, el zoom la multiplica, y la
//   luz es la de estudio del producto.
// - Modo vista: la camara sale del anchor de la foto y el centro del cartel cae en su
//   (x, y) con setViewOffset. Sin orbita; el zoom de este modo es CSS, fuera del canvas.
// Sin Suspense y sin loaders: el unico asset es el HDRI, que entra con su propio fallback.

// Misma ruta que sondea PhotoStage: una sola fuente de verdad. Es la ruta del paquete de
// assets de TAREA_011 (Poly Haven, Studio Small 08, CC0).
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
  hdriReady: boolean
  reducedMotion: boolean
  // Cajas por letra en modo letters, null en modo area.
  letters: LetterBox[] | null
  letterDepth: number
}

type ViewerCameraProps = {
  volume: SignVolume
  photo: ClientPhoto | null
  signZoom: number
  reducedMotion: boolean
}

function ViewerCamera({ volume, photo, signZoom, reducedMotion }: ViewerCameraProps) {
  const cameraRef = useRef<PerspectiveCameraImpl>(null)
  // Distancia aplicada en el frame anterior; null al entrar al modo cartel, que va de golpe.
  const distanceRef = useRef<number | null>(null)
  const direction = useMemo(() => new Vector3(), [])
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height

  // Modo vista: posicion, fov y corrimiento salen del anchor. Se recalcula con el tamano del
  // canvas porque el corrimiento va en pixeles.
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || photo === null) {
      return
    }
    const { anchor } = photo
    const distance = photoCameraDistance(anchor.metersToWidth, anchor.fovDeg, aspect)
    camera.fov = anchor.fovDeg
    camera.position.set(...orbitPosition(anchor.cameraYawDeg, anchor.cameraPitchDeg, distance))
    camera.lookAt(0, 0, 0)
    const [offsetX, offsetY] = lensShift(anchor.x, anchor.y, size.width, size.height)
    camera.setViewOffset(size.width, size.height, offsetX, offsetY, size.width, size.height)
    camera.updateProjectionMatrix()
  }, [photo, aspect, size.width, size.height])

  // Modo cartel al entrar: de frente, apenas por encima. La distancia la pone el frame loop.
  // Depende solo de si hay foto: cambiar el cartel no le devuelve el azimut al frente.
  const signMode = photo === null
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || !signMode) {
      return
    }
    camera.clearViewOffset()
    camera.fov = SIGN_VIEW.fovDeg
    const pitchDeg = 90 - MathUtils.radToDeg(SIGN_VIEW.startPolar)
    camera.position.set(...orbitPosition(0, pitchDeg, 1))
    camera.lookAt(0, 0, 0)
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
    direction.copy(camera.position).normalize()
    const target = signFrameDistance(volume, [direction.x, direction.y, direction.z], aspect) * signZoom
    const current = distanceRef.current
    const next = current === null || reducedMotion ? target : approach(current, target, delta)
    camera.position.copy(direction.multiplyScalar(next))
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
          target={[0, 0, 0]}
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
  hdriReady,
  reducedMotion,
  letters,
  letterDepth,
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
  const depth = letters === null ? SET.sign.thickness : letterDepth
  const volume = useMemo((): SignVolume => ({ width, height, depth }), [width, height, depth])

  return (
    <>
      <ViewerCamera volume={volume} photo={photo} signZoom={signZoom} reducedMotion={reducedMotion} />

      <ambientLight intensity={light.ambient} />
      <directionalLight position={keyPosition} intensity={light.keyIntensity} />
      {hdriReady ? <StudioEnvironment src={HDRI_SRC} /> : null}

      <SignBoard
        placement={placement}
        material={material}
        lightingMode={lightingMode}
        shadowColor={palette.shadow}
        reducedMotion={reducedMotion}
        letters={letters}
        letterDepth={letterDepth}
        signMode={photo === null}
      />
      {letters === null ? (
        <SignFace placement={placement} color={palette.signText} text={text} />
      ) : (
        <LetterFaces
          letters={letters}
          letterHeight={placement.box.height}
          letterDepth={letterDepth}
          color={palette.signText}
        />
      )}
    </>
  )
}
