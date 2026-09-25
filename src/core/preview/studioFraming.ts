import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Vector3, type PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { STUDIO_VIEW, approach, frameDistance, startDirection, type FrameVolume, type StudioStart, type Vec3 } from './studioView'

// Encuadre del modo de estudio (SPEC 12 y 21.5): la distancia derivada en cada frame de la huella
// de la caja de encuadre, que el zoom multiplica. Lo usan StudioCamera y las vistas con otros
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
    const wanted = frameDistance(volume, [direction.x, direction.y, direction.z], aspect) * zoom
    const next = current === null || reducedMotion ? wanted : approach(current, wanted, delta)
    camera.position.copy(direction.multiplyScalar(next).add(target))
    if (current === null) {
      camera.lookAt(target)
    }
    distanceRef.current = next
  })
}
