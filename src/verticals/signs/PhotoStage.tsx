import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { HDRI_SRC, SignScene } from './scene/SignScene'
import { layoutLetters, scenePalette, signPlacement, totemStructureColor, type SignPlacement } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import { createTypeface, disposeGlyphGeometries, glyphAdvance, TYPEFACE_SRC, type Typeface } from './scene/typeface'
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
  reducedMotion: boolean
  // Modo vista: escala CSS de foto y canvas juntos.
  cssZoom: number
  // Modo cartel: multiplicador de la distancia que encuadra la huella del cartel.
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

// El typeface del texto 3D (SPEC 12, version 1.14): un solo pedido por pagina, compartido
// entre montajes. Si no llega o no es un typeface, el cartel se dibuja sin texto; igual que
// con el HDRI, el rewrite de SPA puede responder el index.html en su lugar.
let typefaceRequest: Promise<Typeface | null> | null = null

function requestTypeface(): Promise<Typeface | null> {
  typefaceRequest ??= fetch(TYPEFACE_SRC)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: unknown) => (data === null ? null : createTypeface(data as Parameters<typeof createTypeface>[0])))
    .catch(() => null)
  return typefaceRequest
}

function useTypeface(): Typeface | null {
  const [typeface, setTypeface] = useState<Typeface | null>(null)
  useEffect(() => {
    let vivo = true
    void requestTypeface().then((loaded) => {
      if (vivo) {
        setTypeface(loaded)
      }
    })
    return () => {
      vivo = false
    }
  }, [])
  return typeface
}

export function PhotoStage({
  selection,
  visual,
  theme,
  photo,
  reducedMotion,
  cssZoom,
  signZoom,
}: PhotoStageProps) {
  const hdriReady = useHdriReady()
  const typeface = useTypeface()
  const palette = useMemo(() => scenePalette(theme), [theme])
  const structureColor = useMemo(() => totemStructureColor(theme), [theme])

  // Las CanvasTexture y las geometrias del halo y de las letras viven mientras vive la
  // escena: se liberan aca.
  useEffect(
    () => () => {
      disposeGlyphGeometries()
      disposeSupportShadow()
      disposeHaloGeometry()
    },
    [],
  )

  // Modo letters: el avance de la palabra por el alto de letra hace de placement, asi halo,
  // sombra y lampara siguen a las letras igual que al panel. La composicion va en alto de
  // mayuscula 1 y el espaciado sale del avance de cada glifo del typeface. Hasta que el
  // typeface carga no hay letras.
  const letterHeightMeters = selection.letterHeight * visual.lengthToMeters
  const letterLayout = useMemo(() => {
    if (visual.mode !== 'letters') {
      return null
    }
    if (typeface === null) {
      return { boxes: [], totalWidth: 0 }
    }
    return layoutLetters(selection.text, 1, (char) => glyphAdvance(typeface, char))
  }, [visual.mode, selection.text, typeface])
  const placement: SignPlacement =
    letterLayout === null
      ? signPlacement(selection, visual.lengthToMeters)
      : { box: { width: letterLayout.totalWidth * letterHeightMeters, height: letterHeightMeters } }

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
            signZoom={signZoom}
            hdriReady={hdriReady}
            reducedMotion={reducedMotion}
            letters={letterLayout === null ? null : letterLayout.boxes}
            letterDepth={visual.depthMeters}
            typeface={typeface}
            totem={visual.totem}
            structureColor={structureColor}
          />
        </Canvas>
      ) : null}
    </div>
  )
}
