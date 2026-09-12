import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { HDRI_SRC, SignScene } from './scene/SignScene'
import { scenePalette, signPlacement } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import { disposeGlyphTextures } from './scene/glyphTexture'
import { disposeSupportShadow } from './scene/supportShadow'
import type { SignVisual } from './visuals'

// Composicion del preview (SPEC 12, version 1.9): tres capas en el mismo cuadro 16:9.
// 1. la foto del cliente, elegida por angulo
// 2. un canvas R3F transparente con el cartel y nada mas
// 3. los controles, fuera del canvas
// El zoom es una transformacion CSS sobre el contenedor de las dos primeras capas, no un
// movimiento de camara: escalando las dos juntas el desalineado no puede existir.
// prefers-reduced-motion se lee aca, fuera del canvas, y baja como prop.

// Medio alto de la camara ortografica, en metros. Tiene que ser el mismo numero que usa
// SignScene: es lo que traduce metros de escena a fraccion del cuadro.
const VIEW_HALF_HEIGHT = 3

const ZOOM = { min: 1, max: 2.5, step: 0.25 }

type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  photos: ClientPhoto[]
  zoomLabel: string
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

export function SignPreview({
  selection,
  visual,
  theme,
  photos,
  zoomLabel,
}: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const [photoId, setPhotoId] = useState(photos[0].id)
  const [zoom, setZoom] = useState(ZOOM.min)
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

  const photo = photos.find((item) => item.id === photoId) ?? photos[0]
  const placement = signPlacement(selection, visual.lengthToMeters)

  // El canvas cubre un recuadro centrado en el anclaje. Su ancho en fraccion del cuadro
  // sale de metersToWidth: cuantos metros ve la camara por cuanto ocupa un metro.
  const canvasWidthPct = 2 * VIEW_HALF_HEIGHT * photo.anchor.metersToWidth * 100
  const canvasHeightPct = canvasWidthPct * (16 / 9)

  return (
    <div className="flex flex-col gap-3">
      <div
        style={theme}
        className="q-hairline relative aspect-video w-full overflow-hidden rounded-2xl border bg-[var(--q-surface)]"
      >
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
                />
              </Canvas>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {photos.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === photo.id}
            className={item.id === photo.id ? 'q-control q-on flex-1' : 'q-control q-off flex-1'}
            onClick={() => {
              setPhotoId(item.id)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
          {zoomLabel}
        </span>
        <input
          type="range"
          aria-label={zoomLabel}
          className="q-range h-11 min-w-0 flex-1"
          min={ZOOM.min}
          max={ZOOM.max}
          step={ZOOM.step}
          value={zoom}
          onChange={(event) => {
            setZoom(event.currentTarget.valueAsNumber)
          }}
        />
      </div>
    </div>
  )
}
