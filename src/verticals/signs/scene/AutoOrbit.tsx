import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils } from 'three'
import { AUTO_ORBIT, autoAzimuth } from './sceneGeometry'

// Barrido lento de camara cuando nadie toca nada. No usa autoRotate de OrbitControls:
// con el azimut clampeado a +-0.4 ese modo gira hasta el tope y se queda pegado.
// No se monta con prefers-reduced-motion ni en el nivel 2 de rendimiento.

type OrbitLike = {
  getAzimuthalAngle: () => number
  setAzimuthalAngle: (value: number) => void
  update: () => unknown
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

function isOrbitLike(value: unknown): value is OrbitLike {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return (
    'getAzimuthalAngle' in value &&
    typeof value.getAzimuthalAngle === 'function' &&
    'setAzimuthalAngle' in value &&
    typeof value.setAzimuthalAngle === 'function' &&
    'update' in value &&
    typeof value.update === 'function' &&
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  )
}

export function AutoOrbit() {
  const controls = useThree((state) => state.controls)
  const dragging = useRef(false)
  const lastInteractionMs = useRef(0)
  const elapsedSeconds = useRef(0)

  useEffect(() => {
    if (!isOrbitLike(controls)) {
      return undefined
    }
    const onStart = (): void => {
      dragging.current = true
    }
    const onEnd = (): void => {
      dragging.current = false
      lastInteractionMs.current = performance.now()
    }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useFrame((_state, delta) => {
    if (!isOrbitLike(controls)) {
      return
    }
    // El reloj del barrido avanza siempre, tambien mientras el usuario arrastra.
    elapsedSeconds.current += delta
    if (dragging.current || performance.now() - lastInteractionMs.current < AUTO_ORBIT.idleMs) {
      return
    }

    const target = autoAzimuth(elapsedSeconds.current)
    const current = controls.getAzimuthalAngle()
    // Al reanudar se vuelve al barrido con damp, no de un salto.
    const next =
      Math.abs(target - current) > AUTO_ORBIT.snapEpsilon
        ? MathUtils.damp(current, target, AUTO_ORBIT.reacquireLambda, delta)
        : target
    controls.setAzimuthalAngle(next)
    // drei actualiza los controles con prioridad negativa, o sea antes que nosotros.
    controls.update()
  })

  return null
}
