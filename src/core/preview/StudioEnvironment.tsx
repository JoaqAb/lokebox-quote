import { Environment, Lightformer } from '@react-three/drei'
import { memo, useMemo } from 'react'
import { STUDIO_RIG, studioSources, type StudioHighlight } from './studioRig'

// Entorno de estudio del preview (SPEC 12 y 18, version 2.2 y 2.3, D55 y D61), igual para
// toda vertical. Se genera con lightformers: no descarga nada y no suspende. Se renderiza una
// sola vez al montar y otra si cambian sus props, nunca de fondo: solo da reflejo.
// intensity escala todo el rig sin tocar sus fuentes: la vertical pasa 1 en su modo de
// estudio, y en una foto su luz ambiente, porque la luz de la foto sigue mandando.
// highlight es la direccion de la fuente especular del modo vista, la key de la foto; null
// en el modo de estudio.

type StudioEnvironmentProps = {
  intensity: number
  highlight: StudioHighlight | null
}

export const StudioEnvironment = memo(function StudioEnvironment({ intensity, highlight }: StudioEnvironmentProps) {
  const azimuth = highlight?.azimuthDeg ?? null
  const elevation = highlight?.elevationDeg ?? null
  const sources = useMemo(
    () => studioSources(azimuth === null || elevation === null ? null : { azimuthDeg: azimuth, elevationDeg: elevation }),
    [azimuth, elevation],
  )
  return (
    <Environment frames={1} resolution={STUDIO_RIG.resolution} environmentIntensity={intensity}>
      <color attach="background" args={[STUDIO_RIG.background]} />
      {sources.map((source) => (
        <Lightformer
          key={source.position.join(',')}
          form="rect"
          position={source.position}
          scale={source.scale}
          intensity={source.intensity}
        />
      ))}
    </Environment>
  )
})
