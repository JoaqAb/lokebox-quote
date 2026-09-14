import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { HDRI_SRC, SignScene } from './scene/SignScene'
import { layoutLetters, scenePalette, signPlacement, type SignPlacement } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import { disposeGlyphTextures, glyphWidth } from './scene/glyphTexture'
import { disposeHaloGeometry } from './scene/haloGeometry'
import { disposeSupportShadow } from './scene/supportShadow'
import type { SignVisual } from './visuals'

// Las capas del viewer (SPEC 12, version 1.12): la foto, solo en modo vista, y el canvas
// con el cartel, que cubre el cuadro entero en los dos modos. El canvas ocupa siempre el
// mismo lugar del arbol: cambiar de modo o de vista no lo remonta ni reinicia nada.
// La comparten el preview y el modo de calibracion, asi lo que se calibra es exactamente
// lo que ve el visitante.

type PhotoStageProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  // null en modo cartel.
  photo: ClientPhoto | null
  // De donde sale la luz en modo cartel: la primera foto del cliente.
  lightPhoto: ClientPhoto
  reducedMotion: boolean
  // Modo vista: escala CSS de foto y canvas juntos.
  cssZoom: number
  // Modo cartel: fraccion de la distancia base de la camara.
  signZoom: number
}

// El HDRI de estudio es opcional: se sondea una vez y, si no esta, la escena corre sin
// reflejo. No alcanza con res.ok: el rewrite de SPA responde 200 con el index.html para
// cualquier ruta que no exista, asi que un HDRI ausente pasaba por presente.
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

export function PhotoStage({
  selection,
  visual,
  theme,
  photo,
  lightPhoto,
  reducedMotion,
  cssZoom,
  signZoom,
}: PhotoStageProps) {
  const hdriReady = useHdriReady()
  const palette = useMemo(() => scenePalette(theme), [theme])

  // Las CanvasTexture y las geometrias del halo viven mientras vive la escena: se liberan aca.
  useEffect(
    () => () => {
      disposeGlyphTextures()
      disposeSupportShadow()
      disposeHaloGeometry()
    },
    [],
  )

  // Modo letters: el contorno de la palabra hace de placement, asi halo, sombra, lampara y
  // encuadre de camara siguen a las letras igual que al panel.
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

  return (
    <div
      className="absolute inset-0 origin-center transition-transform duration-200"
      style={{ transform: `scale(${String(photo === null ? 1 : cssZoom)})` }}
    >
      {photo === null ? null : (
        <img src={photo.src} alt={photo.label} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {hasWebGL() ? (
        <Canvas gl={{ antialias: true, alpha: true }} className="!absolute inset-0" style={{ background: 'transparent' }}>
          <SignScene
            placement={placement}
            text={selection.text}
            material={visual.material}
            lightingMode={visual.lighting.mode}
            palette={palette}
            photo={photo}
            lightPhoto={lightPhoto}
            signZoom={signZoom}
            hdriReady={hdriReady}
            reducedMotion={reducedMotion}
            letters={letterLayout === null ? null : letterLayout.boxes}
            letterDepth={visual.depthMeters}
          />
        </Canvas>
      ) : null}
    </div>
  )
}
