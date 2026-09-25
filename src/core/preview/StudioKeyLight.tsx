import { useLayoutEffect, useMemo, useRef } from 'react'
import type { Color, DirectionalLight } from 'three'
import { ATTENUATION_LAYER } from './render'
import { STUDIO_SHADOW, keyLightPosition, type KeyLight } from './studioView'

// Ambiente y key de la escena (SPEC 12, version 2.0): la key proyecta sombra de mapa con la
// camara ortografica de medio lado reach, que la vertical deriva de su caja de encuadre con
// studioShadowReach. En el core desde TAREA_033 (D143).

type StudioKeyLightProps = {
  light: KeyLight
  color: Color
  reach: number
}

export function StudioKeyLight({ light, color, reach }: StudioKeyLightProps) {
  const position = useMemo(() => keyLightPosition(light), [light])
  // La key tambien va en la capa de atenuacion (version 2.6, D79): three solo cuenta las luces de
  // las capas que dibuja la camara, y los receptores de sombra se dibujan solos en esa capa.
  const keyRef = useRef<DirectionalLight>(null)
  useLayoutEffect(() => {
    keyRef.current?.layers.enable(ATTENUATION_LAYER)
  }, [])

  return (
    <>
      <ambientLight intensity={light.ambient} color={color} />
      <directionalLight
        ref={keyRef}
        position={position}
        intensity={light.keyIntensity}
        color={color}
        castShadow
        shadow-mapSize={[STUDIO_SHADOW.mapSize, STUDIO_SHADOW.mapSize]}
        shadow-bias={STUDIO_SHADOW.bias}
        shadow-normalBias={STUDIO_SHADOW.normalBias}
        shadow-radius={STUDIO_SHADOW.radius}
        shadow-camera-left={-reach}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-camera-bottom={-reach}
        shadow-camera-near={STUDIO_SHADOW.near}
        shadow-camera-far={STUDIO_SHADOW.far}
      />
    </>
  )
}
