import { PREVIEW_ZOOM } from './studioView'

// Franja de controles del preview (SPEC 12, D92, D98 y D100): un control segmentado abajo al
// centro y el zoom a la derecha, en una franja al pie de la zona, sobre el escenario. Sin barra de
// zoom: rueda (y pinch del trackpad, que llega como rueda con ctrl), pinch con dos dedos y dos
// botones + y -, con aria-label derivado de la clave de texto que pasa la vertical. En el core
// desde TAREA_033 (D143): cada vertical decide las opciones del control segmentado y que hace el
// zoom en su escena.
// En la franja el selector va al centro entre dos rellenos de base 0; el de la derecha no baja
// del ancho del zoom, asi en una pantalla angosta el selector se corre a la izquierda antes de
// tocarlo, y solo si tampoco entra scrollea.

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export type SegmentOption = {
  key: string
  label: string
  active: boolean
  onSelect: () => void
}

type PreviewStripProps = {
  options: SegmentOption[]
  zoom: number
  onStep: (direction: 1 | -1) => void
  zoomLabel: string
}

export function PreviewStrip({ options, zoom, onStep, zoomLabel }: PreviewStripProps) {
  return (
    <div
      data-controls
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-[var(--q-strip)] items-center gap-2 px-3"
    >
      <div className="min-w-0 flex-1 basis-0" />
      <div
        role="group"
        data-view-selector
        className="q-panel q-hairline pointer-events-auto flex min-w-0 gap-1 overflow-x-auto rounded-full border p-1 shadow-sm"
      >
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.active}
            className={`${option.active ? 'q-on' : 'text-[var(--q-text)]'} min-h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm`}
            onClick={option.onSelect}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 basis-0 justify-end">
        <div data-zoom className="q-panel q-hairline pointer-events-auto flex shrink-0 overflow-hidden rounded-full border shadow-sm">
          <button
            type="button"
            aria-label={`${zoomLabel} -`}
            disabled={zoom <= PREVIEW_ZOOM.min}
            className="flex size-9 items-center justify-center text-[var(--q-text)] disabled:opacity-40"
            onClick={() => {
              onStep(-1)
            }}
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            aria-label={`${zoomLabel} +`}
            disabled={zoom >= PREVIEW_ZOOM.max}
            className="q-hairline flex size-9 items-center justify-center border-l text-[var(--q-text)] disabled:opacity-40"
            onClick={() => {
              onStep(1)
            }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
