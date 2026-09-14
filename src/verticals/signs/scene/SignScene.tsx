import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import type { ClientPhoto, MaterialVisual } from '../../../core/types'
import { SignBoard } from './SignBoard'
import { LetterFaces, SignFace } from './SignFace'
import { StudioEnvironment } from './StudioEnvironment'
import {
  SIGN_VIEW,
  lensShift,
  orbitPosition,
  photoCameraDistance,
  signFrameDistance,
  type LetterBox,
  type ScenePalette,
  type SignPlacement,
} from './sceneGeometry'

// Contenido del canvas: camara en perspectiva, la luz de la foto, el cartel y el texto de
// su cara (SPEC 12, version 1.12). El cartel queda siempre en el origen y sin rotar; lo
// que cambia entre los dos modos del viewer es la camara.
// - Modo cartel (photo null): fov fijo, OrbitControls con azimut libre y polar acotado,
//   distancia base que encuadra el cartel, y el zoom acerca la camara.
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
  // La foto de la que sale la luz: la elegida en modo vista, la primera en modo cartel.
  lightPhoto: ClientPhoto
  // Fraccion de la distancia base en modo cartel, entre SIGN_VIEW.nearFactor y 1.
  signZoom: number
  hdriReady: boolean
  reducedMotion: boolean
  // Cajas por letra en modo letters, null en modo area.
  letters: LetterBox[] | null
  letterDepth: number
}

type ViewerCameraProps = {
  placement: SignPlacement
  photo: ClientPhoto | null
  signZoom: number
}

function ViewerCamera({ placement, photo, signZoom }: ViewerCameraProps) {
  const cameraRef = useRef<PerspectiveCameraImpl>(null)
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height
  const { width, height } = placement.box
  const baseDistance = signFrameDistance({ width, height }, aspect)

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

  // Modo cartel al entrar: de frente, apenas por encima, a la distancia base. Depende solo
  // de si hay foto: cambiar el cartel no le devuelve el azimut al frente.
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
  }, [signMode])

  // Modo cartel: el tamano del cartel y el zoom cambian la distancia sin tocar el azimut
  // que eligio el visitante.
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || !signMode) {
      return
    }
    const direction = new Vector3().copy(camera.position).normalize()
    camera.position.copy(direction.multiplyScalar(baseDistance * signZoom))
    camera.updateProjectionMatrix()
  }, [signMode, baseDistance, signZoom])

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
  lightPhoto,
  signZoom,
  hdriReady,
  reducedMotion,
  letters,
  letterDepth,
}: SignSceneProps) {
  // La luz viene de la foto, no de constantes del codigo: cada foto dice de donde le
  // pega el sol, para que el volumen del cartel case con ella.
  const keyPosition = useMemo((): [number, number, number] => {
    const az = MathUtils.degToRad(lightPhoto.light.keyAzimuthDeg)
    const el = MathUtils.degToRad(lightPhoto.light.keyElevationDeg)
    const r = 10
    return [r * Math.sin(az) * Math.cos(el), r * Math.sin(el), r * Math.cos(az) * Math.cos(el)]
  }, [lightPhoto])

  return (
    <>
      <ViewerCamera placement={placement} photo={photo} signZoom={signZoom} />

      <ambientLight intensity={lightPhoto.light.ambient} />
      <directionalLight position={keyPosition} intensity={lightPhoto.light.keyIntensity} />
      {hdriReady ? <StudioEnvironment src={HDRI_SRC} /> : null}

      <SignBoard
        placement={placement}
        material={material}
        lightingMode={lightingMode}
        shadowColor={palette.shadow}
        reducedMotion={reducedMotion}
        letters={letters}
        letterDepth={letterDepth}
        haloEnabled={photo !== null}
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
