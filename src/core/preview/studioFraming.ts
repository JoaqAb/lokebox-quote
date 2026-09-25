import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Vector3, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { useStripOverlap } from './stripOverlap'
import { STUDIO_VIEW, approach, frameDistance, startDirection, type FrameVolume, type StudioStart, type Vec3 } from './studioView'

// Encuadre del modo de estudio (SPEC 12 y 21.5): la distancia derivada en cada frame de la huella
// de la caja de encuadre, que el zoom multiplica, en el rectangulo que deja libre la franja de
// controles (desde 2.17, D160). Lo usan StudioCamera y las vistas con otros
// modos de camara. En el core desde TAREA_033 (D143).

export type StudioFrame = {
  volume: FrameVolume
  // Centro de la caja de encuadre: el target de la orbita.
  center: Vec3
  // Multiplicador de la distancia, entre STUDIO_VIEW.nearFactor y 1.
  zoom: number
  reducedMotion: boolean
  // Arranque de la vista (D151). Sin el, de frente y apenas por encima.
  start?: StudioStart
}

// Encuadre con la franja de controles (D160): el rectangulo visible es el canvas menos los strip px
// que tapa la franja al pie. visibleRatio es su fraccion del alto, que achica el cuadro vertical de
// frameDistance, y offsetY el corrimiento de la vista que centra el target en ese rectangulo: la
// proyeccion corre strip / 2 hacia abajo, asi el centro cae en (alto - strip) / 2. El target y la
// posicion de la camara no se tocan. Con strip 0, el encuadre de siempre y sin corrimiento.
export type StripView = { visibleRatio: number; offsetY: number }

const NO_STRIP: StripView = { visibleRatio: 1, offsetY: 0 }

export function stripView(height: number, strip: number): StripView {
  if (!(height > 0) || strip < 0 || strip >= height) {
    throw new Error(`stripView: franja fuera del canvas: alto ${String(height)}, franja ${String(strip)}`)
  }
  return { visibleRatio: (height - strip) / height, offsetY: strip / 2 }
}

// Encuadre del modo de estudio sobre una camara ya montada. active es si la camara esta en modo
// de estudio: al entrar va al arranque de la vista, o de frente y apenas por encima, y el primer
// frame pone posicion y distancia de golpe. Cambiar la pieza no devuelve la camara al arranque.
export function useStudioFraming(cameraRef: RefObject<PerspectiveCameraImpl | null>, frame: StudioFrame, active: boolean): void {
  const { volume, center, zoom, reducedMotion, start } = frame
  // Se calcula en el render: un arranque fuera de la orbita lanza antes de montar la escena.
  const azimuth = start?.azimuthDeg
  const polar = start?.polar
  const first = useMemo(
    () => startDirection(azimuth === undefined || polar === undefined ? undefined : { azimuthDeg: azimuth, polar }),
    [azimuth, polar],
  )
  // Distancia aplicada en el frame anterior; null al entrar al modo de estudio, que va de golpe.
  const distanceRef = useRef<number | null>(null)
  const direction = useMemo(() => new Vector3(), [])
  const [cx, cy, cz] = center
  const target = useMemo(() => new Vector3(cx, cy, cz), [cx, cy, cz])
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height
  const strip = useStripOverlap()
  // Mientras el canvas no tiene alto, o si la franja lo tapa entero, no hay rectangulo que encuadrar:
  // sin corrimiento.
  const view = size.height > 0 && strip < size.height ? stripView(size.height, strip) : NO_STRIP
  const { visibleRatio, offsetY } = view

  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || !active) {
      return
    }
    camera.clearViewOffset()
    camera.fov = STUDIO_VIEW.fovDeg
    camera.updateProjectionMatrix()
    distanceRef.current = null
  }, [cameraRef, active])

  // El corrimiento de la vista sigue al tamano del canvas y a la franja. Va despues del efecto de
  // arriba, que lo limpia al entrar al modo de estudio.
  useLayoutEffect(() => {
    const camera = cameraRef.current
    if (camera === null || !active) {
      return
    }
    if (offsetY === 0) {
      camera.clearViewOffset()
    } else {
      camera.setViewOffset(size.width, size.height, 0, offsetY, size.width, size.height)
    }
    camera.updateProjectionMatrix()
  }, [cameraRef, active, size.width, size.height, offsetY])

  // En cada frame, la distancia que encuadra la huella de la caja desde la orientacion actual,
  // por el zoom, con damp. Solo cambia el largo del vector: el azimut y el polar son los que dejo
  // OrbitControls, que actualiza antes en el mismo frame.
  useFrame((_state, delta) => {
    const camera = cameraRef.current
    if (camera === null || !active) {
      return
    }
    const current = distanceRef.current
    if (current === null) {
      direction.set(...first)
    } else {
      direction.copy(camera.position).sub(target).normalize()
    }
    const wanted = frameDistance(volume, [direction.x, direction.y, direction.z], aspect, visibleRatio) * zoom
    const next = current === null || reducedMotion ? wanted : approach(current, wanted, delta)
    camera.position.copy(direction.multiplyScalar(next).add(target))
    if (current === null) {
      camera.lookAt(target)
    }
    distanceRef.current = next
  })
}
