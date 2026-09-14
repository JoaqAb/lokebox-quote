import { useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { PhotoStage } from './PhotoStage'
import type { SignVisual } from './visuals'

// Composicion del preview (SPEC 12, version 1.9): tres capas en el mismo cuadro 16:9.
// 1. la foto del cliente, elegida por angulo
// 2. un canvas R3F transparente con el cartel y nada mas
// 3. los controles, fuera del canvas
// Las dos primeras viven en PhotoStage. El zoom es una transformacion CSS sobre ese
// contenedor, no un movimiento de camara: escalando las dos juntas el desalineado no
// puede existir. prefers-reduced-motion se lee aca, fuera del canvas, y baja como prop.

const ZOOM = { min: 1, max: 2.5, step: 0.25 }

type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  photos: ClientPhoto[]
  zoomLabel: string
}

export function SignPreview({ selection, visual, theme, photos, zoomLabel }: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const [photoId, setPhotoId] = useState(photos[0].id)
  const [zoom, setZoom] = useState(ZOOM.min)

  const photo = photos.find((item) => item.id === photoId) ?? photos[0]

  return (
    <div className="flex flex-col gap-3">
      <div
        style={theme}
        className="q-hairline relative aspect-video w-full overflow-hidden rounded-2xl border bg-[var(--q-surface)]"
      >
        <PhotoStage
          selection={selection}
          visual={visual}
          theme={theme}
          photo={photo}
          reducedMotion={reducedMotion}
          zoom={zoom}
        />
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
