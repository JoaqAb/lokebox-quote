import { useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import { PhotoStage } from './PhotoStage'
import { signZoomFactor } from './scene/sceneGeometry'
import type { SignVisual } from './visuals'

// Viewer del cotizador (SPEC 12, version 1.12), en dos modos sobre el mismo canvas:
// - modo cartel, el default al cargar: el cartel solo, que el visitante gira;
// - modo vista: una foto del cliente con el cartel compuesto, fijo.
// Debajo, el selector de vistas (primero el modo cartel, despues una por foto) y el zoom,
// que en modo cartel acerca la camara y en modo vista escala foto y canvas por CSS.
// prefers-reduced-motion se lee aca, fuera del canvas, y baja como prop.
// El fondo del marco depende de la vista (SPEC 12, version 1.16): en modo cartel es el
// escenario --q-stage, que contrasta con un cartel claro; en modo vista la foto lo cubre y
// queda --q-surface.

const ZOOM = { min: 1, max: 2.5, step: 0.25 }

// La vista elegida. El modo cartel no es una foto y va en su propia rama, asi ningun id de
// foto del JSON puede chocar con el.
type View = { kind: 'sign' } | { kind: 'photo'; id: string }

type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  photos: ClientPhoto[]
  zoomLabel: string
  signOnlyLabel: string
}

export function SignPreview({ selection, visual, theme, photos, zoomLabel, signOnlyLabel }: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const [view, setView] = useState<View>({ kind: 'sign' })
  const [zoom, setZoom] = useState(ZOOM.min)

  const photo = view.kind === 'photo' ? (photos.find((item) => item.id === view.id) ?? null) : null

  const options = [
    { key: 'sign', label: signOnlyLabel, active: photo === null, pick: (): View => ({ kind: 'sign' }) },
    ...photos.map((item) => ({
      key: `photo-${item.id}`,
      label: item.label,
      active: photo?.id === item.id,
      pick: (): View => ({ kind: 'photo', id: item.id }),
    })),
  ]

  return (
    <div className="flex flex-col gap-3">
      <div
        style={theme}
        className={`q-hairline relative aspect-video w-full overflow-hidden rounded-2xl border ${photo === null ? 'cursor-grab bg-[var(--q-stage)] active:cursor-grabbing' : 'bg-[var(--q-surface)]'}`}
      >
        <PhotoStage
          selection={selection}
          visual={visual}
          theme={theme}
          photo={photo}
          reducedMotion={reducedMotion}
          cssZoom={zoom}
          signZoom={signZoomFactor(zoom, ZOOM)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.active}
            className={option.active ? 'q-control q-on flex-1' : 'q-control q-off flex-1'}
            onClick={() => {
              setView(option.pick())
            }}
          >
            {option.label}
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
