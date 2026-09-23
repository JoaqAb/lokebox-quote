import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { FileLoader } from 'three'
import type { FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { AssetBoundary } from '../../core/preview/AssetBoundary'
import { PreviewCanvas } from '../../core/preview/PreviewCanvas'
import type { LoadingBrand } from '../../core/ui/LoadingScreen'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { SignScene } from './scene/SignScene'
import {
  layoutLetters,
  scenePalette,
  signPlacement,
  totemStructureColor,
  type ScenePalette,
  type SignPlacement,
} from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import { createTypeface, disposeGlyphGeometries, glyphAdvance, TYPEFACE_SRC, type Typeface } from './scene/typeface'
import { disposeHaloGeometry } from './scene/haloGeometry'
import { disposeSupportShadow } from './scene/supportShadow'
import { disposePanelParts } from './scene/surfaceParts'
import { disposeFinishTextures } from '../../core/preview/finishTextures'
import type { SignVisual } from './visuals'

// Las capas del viewer (SPEC 12, version 1.12): la foto, solo en modo vista, y el canvas
// con el cartel, que cubre el cuadro entero en los dos modos. El canvas ocupa siempre el
// mismo lugar del arbol: cambiar de modo o de vista no lo remonta ni reinicia nada.
// La comparten el preview y el modo de calibracion, asi lo que se calibra es exactamente
// lo que ve el visitante.
// Desde la version 2.0 el canvas es el del core (PreviewCanvas, SPEC 18), con su pipeline y
// su pantalla de carga; aca queda solo la escena del cartel.

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
  // Logo y texto de la pantalla de carga.
  loading: LoadingBrand
}

type StageSceneProps = {
  selection: SignSelection
  visual: SignVisual
  palette: ScenePalette
  structureColor: string
  photo: ClientPhoto | null
  reducedMotion: boolean
  signZoom: number
}

// La escena con el typeface ya resuelto, o null si no cargo: el cartel se dibuja sin texto.
// Modo letters: el avance de la palabra por el alto de letra hace de placement, asi halo,
// sombra y lampara siguen a las letras igual que al panel. La composicion va en alto de
// mayuscula 1 y el espaciado sale del avance de cada glifo del typeface. Sin typeface no hay
// letras.
function StageScene({
  selection,
  visual,
  palette,
  structureColor,
  photo,
  reducedMotion,
  signZoom,
  typeface,
}: StageSceneProps & { typeface: Typeface | null }) {
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
    <SignScene
      placement={placement}
      text={selection.text}
      material={visual.material}
      lightingMode={visual.lighting.mode}
      palette={palette}
      photo={photo}
      signZoom={signZoom}
      reducedMotion={reducedMotion}
      letters={letterLayout === null ? null : letterLayout.boxes}
      letterDepth={visual.depthMeters}
      typeface={typeface}
      totem={visual.totem}
      structureColor={structureColor}
    />
  )
}

// El typeface del texto 3D (SPEC 12, version 1.14) entra por el LoadingManager de three y
// suspende (version 2.0): asi su descarga es parte del progreso de la pantalla de carga.
// FileLoader con respuesta json y no FontLoader: FontLoader parsea dentro del callback y un
// index.html de la SPA en lugar del typeface lanzaria fuera de la promesa, sin llegar nunca
// al limite de error. useLoader cachea por ruta: un solo pedido por pagina.
function TypefaceScene(props: StageSceneProps) {
  const data = useLoader(FileLoader, TYPEFACE_SRC, (loader) => {
    loader.setResponseType('json')
  })
  const typeface = useMemo(() => createTypeface(data as unknown as FontData), [data])
  return <StageScene {...props} typeface={typeface} />
}

export function PhotoStage({
  selection,
  visual,
  theme,
  photo,
  reducedMotion,
  cssZoom,
  signZoom,
  loading,
}: PhotoStageProps) {
  const palette = useMemo(() => scenePalette(theme), [theme])
  const structureColor = useMemo(() => totemStructureColor(theme), [theme])

  // Las CanvasTexture, los mapas de los acabados y las geometrias del panel, del halo y de las
  // letras viven mientras vive la escena: se liberan aca.
  useEffect(
    () => () => {
      disposeGlyphGeometries()
      disposePanelParts()
      disposeSupportShadow()
      disposeFinishTextures()
      disposeHaloGeometry()
    },
    [],
  )

  const scene: StageSceneProps = { selection, visual, palette, structureColor, photo, reducedMotion, signZoom }

  return (
    <div
      className="absolute inset-0 origin-center transition-transform duration-200"
      style={{ transform: `scale(${String(photo === null ? 1 : cssZoom)})` }}
    >
      {photo === null ? null : (
        <img src={photo.src} alt={photo.label} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {hasWebGL() ? (
        <PreviewCanvas loading={loading}>
          <AssetBoundary fallback={<StageScene {...scene} typeface={null} />}>
            <TypefaceScene {...scene} />
          </AssetBoundary>
        </PreviewCanvas>
      ) : null}
    </div>
  )
}
