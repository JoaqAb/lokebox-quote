import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { FileLoader } from 'three'
import type { FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { AssetBoundary } from '../../core/preview/AssetBoundary'
import { PreviewCanvas } from '../../core/preview/PreviewCanvas'
import type { LoadingBrand } from '../../core/ui/LoadingScreen'
import type { ClientPhoto, SignSelection } from './types'
import { SignScene } from './scene/SignScene'
import {
  layoutLetters,
  scenePalette,
  signPlacement,
  tintRect,
  totemStructureColor,
  type ScenePalette,
  type SignPlacement,
} from './scene/sceneGeometry'
import { hasWebGL } from '../../core/preview/webgl'
import { createTypeface, disposeGlyphGeometries, glyphAdvance, TYPEFACE_SRC, type Typeface } from './scene/typeface'
import { disposeHaloGeometry } from './scene/haloGeometry'
import { disposeSupportShadow } from '../../core/preview/supportShadow'
import { disposeFinishTextures } from '../../core/preview/finishTextures'
import { photoTint, type Tint } from '../../core/preview/photoTint'
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
  // Tinte de la foto elegida (version 2.5, D77), o null mientras no se midio.
  tint: Tint | null
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
  tint,
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
      mount={visual.mount}
      structureColor={structureColor}
      tint={tint}
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

// Lado mayor de la copia reducida de la foto que se mide: el tinte es un promedio y no necesita
// la foto entera.
const TINT_SAMPLE_PX = 256

// Casado de tono (version 2.5, D77): el tinte de cada foto se mide una vez, cuando la foto carga,
// en el rectangulo fijo alrededor de su anchor. No depende del cartel, asi que un slider no lo
// cambia. Si la foto no se puede leer, no hay tinte y la luz queda blanca.
function usePhotoTints(photo: ClientPhoto | null): Tint | null {
  const [tints, setTints] = useState<Record<string, Tint>>({})
  const id = photo?.id ?? null
  const known = id === null ? undefined : tints[id]
  useEffect(() => {
    if (photo === null || known !== undefined) {
      return
    }
    let active = true
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, TINT_SAMPLE_PX / Math.max(image.naturalWidth, image.naturalHeight))
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (context === null || !active) {
        return
      }
      context.drawImage(image, 0, 0, width, height)
      const tint = photoTint(context.getImageData(0, 0, width, height).data, width, height, tintRect(photo.anchor.x, photo.anchor.y))
      setTints((current) => ({ ...current, [photo.id]: tint }))
    }
    image.src = photo.src
    return () => {
      active = false
    }
  }, [photo, known])
  return known ?? null
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

  // La CanvasTexture de la sombra, los mapas de los acabados y las geometrias del halo y de las
  // letras viven mientras vive la escena: se liberan aca. El panel redondeado y los separadores
  // los libera SignBoard, que los arma por medida (version 2.4).
  useEffect(
    () => () => {
      disposeGlyphGeometries()
      disposeSupportShadow()
      disposeFinishTextures()
      disposeHaloGeometry()
    },
    [],
  )

  const tint = usePhotoTints(photo)
  const scene: StageSceneProps = { selection, visual, palette, structureColor, photo, reducedMotion, signZoom, tint }

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
