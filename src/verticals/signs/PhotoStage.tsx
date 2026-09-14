import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { HDRI_SRC, SignScene, VIEW_HALF_HEIGHT } from './scene/SignScene'
import { layoutLetters, scenePalette, signPlacement, type SignPlacement } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import { disposeGlyphTextures, glyphWidth } from './scene/glyphTexture'
import { disposeSupportShadow } from './scene/supportShadow'
import type { SignVisual } from './visuals'

// Las dos primeras capas del preview (SPEC 12): la foto y el canvas transparente con el
// cartel, dentro de un mismo contenedor que recibe el zoom. La comparten el preview y el
// modo de calibracion, asi lo que se calibra es exactamente lo que ve el visitante.

type PhotoStageProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  photo: ClientPhoto
  reducedMotion: boolean
  zoom: number
}

// El HDRI de estudio es opcional: se sondea una vez y, si no esta, la escena corre sin
// reflejo. Asi el dia que el archivo entre al repo no hay que tocar una linea de codigo.
// No alcanza con res.ok: el rewrite de SPA responde 200 con el index.html para cualquier
// ruta que no exista, asi que un HDRI ausente pasaba por presente y el loader lanzaba.
function useHdriReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let vivo = true
    void fetch(HDRI_SRC, { method: 'HEAD' })
      .then((res) => {
        const tipo = res.headers.get('content-type') ?? ''
        if (vivo && res.ok && !tipo.includes('text/html')) {
          setReady(true)
        }
      })
      .catch(() => {
        // Sin HDRI el preview funciona igual: no hay nada que reportar.
      })
    return () => {
      vivo = false
    }
  }, [])
  return ready
}

export function PhotoStage({ selection, visual, theme, photo, reducedMotion, zoom }: PhotoStageProps) {
  const hdriReady = useHdriReady()
  const palette = useMemo(() => scenePalette(theme), [theme])

  // Las CanvasTexture viven mientras vive la escena, no una por render: se liberan aca.
  useEffect(
    () => () => {
      disposeGlyphTextures()
      disposeSupportShadow()
    },
    [],
  )

  // Modo letters: el contorno de la palabra hace de placement, asi halo, sombra y lampara
  // siguen a las letras igual que al panel. El alto de letra pasa a metros como el resto.
  const letterHeightMeters = selection.letterHeight * visual.lengthToMeters
  const letterLayout = useMemo(
    () =>
      visual.mode === 'letters' ? layoutLetters(selection.text, letterHeightMeters, glyphWidth) : null,
    [visual.mode, selection.text, letterHeightMeters],
  )
  const placement: SignPlacement =
    letterLayout === null
      ? signPlacement(selection, visual.lengthToMeters)
      : { box: { width: letterLayout.totalWidth, height: letterHeightMeters } }

  // El canvas cubre un recuadro centrado en el anclaje. Su ancho en fraccion del cuadro
  // sale de metersToWidth: cuantos metros ve la camara por cuanto ocupa un metro.
  const canvasWidthPct = 2 * VIEW_HALF_HEIGHT * photo.anchor.metersToWidth * 100
  const canvasHeightPct = canvasWidthPct * (16 / 9)

  return (
    <div
      className="absolute inset-0 origin-center transition-transform duration-200"
      style={{ transform: `scale(${String(zoom)})` }}
    >
      <img src={photo.src} alt={photo.label} className="absolute inset-0 h-full w-full object-cover" />
      {hasWebGL() ? (
        <div
          className="absolute"
          style={{
            left: `${String(photo.anchor.x * 100)}%`,
            top: `${String(photo.anchor.y * 100)}%`,
            width: `${String(canvasWidthPct)}%`,
            height: `${String(canvasHeightPct)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Canvas gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
            <SignScene
              placement={placement}
              text={selection.text}
              material={visual.material}
              lightingMode={visual.lighting.mode}
              palette={palette}
              photo={photo}
              hdriReady={hdriReady}
              reducedMotion={reducedMotion}
              letters={letterLayout === null ? null : letterLayout.boxes}
              letterDepth={visual.depthMeters}
            />
          </Canvas>
        </div>
      ) : null}
    </div>
  )
}
