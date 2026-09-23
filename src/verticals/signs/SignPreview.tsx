import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import type { LoadingBrand } from '../../core/ui/LoadingScreen'
import { PhotoStage } from './PhotoStage'
import { containBox, signZoomFactor, zoomBy, zoomFromPinch, type Size } from './scene/sceneGeometry'
import type { SignVisual } from './visuals'

// Viewer del cotizador (SPEC 12, version 1.12), en dos modos sobre el mismo canvas:
// - modo cartel, el default al cargar: el cartel solo, que el visitante gira;
// - modo vista: una foto del cliente con el cartel compuesto, fijo.
// prefers-reduced-motion se lee aca, fuera del canvas, y baja como prop.
// Desde la version 2.8:
// - D91: sin marco 16:9 fijo. La zona del preview llena el area que le da el layout, sobre
//   --q-stage. En modo cartel el canvas la llena; en modo vista foto y canvas van juntos en una
//   caja con la proporcion de la foto, entera (contain) y centrada, asi el anclaje sigue siendo
//   relativo al rectangulo de la foto. La caja es el mismo elemento en los dos modos: cambiar de
//   modo o de vista no remonta el canvas.
// - D92: el selector de vistas es un control segmentado sobre el preview, abajo al centro. Sin
//   barra de zoom: rueda (y pinch del trackpad, que llega como rueda con ctrl), pinch con dos dedos
//   y dos botones + y -, con aria-label derivado de previewZoomLabel. Los rangos y los dos
//   mecanismos de SPEC 12 no cambian: en modo cartel acerca la camara, en modo vista escala foto y
//   canvas por CSS.

const ZOOM = { min: 1, max: 2.5, step: 0.25 }

// Proporcion de una foto hasta que carga: la de las fotos de la demo.
const DEFAULT_PHOTO_ASPECT = 16 / 9

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
  // Logo y texto de la pantalla de carga del core (SPEC 18).
  loading: LoadingBrand
}

// Proporcion real de cada foto, medida cuando carga.
function usePhotoAspect(photo: ClientPhoto | null): number {
  const [aspects, setAspects] = useState<Record<string, number>>({})
  const id = photo?.id ?? null
  const known = id === null ? undefined : aspects[id]
  useEffect(() => {
    if (photo === null || known !== undefined) {
      return
    }
    let active = true
    const image = new Image()
    image.onload = () => {
      if (active && image.naturalHeight > 0) {
        setAspects((current) => ({ ...current, [photo.id]: image.naturalWidth / image.naturalHeight }))
      }
    }
    image.src = photo.src
    return () => {
      active = false
    }
  }, [photo, known])
  return known ?? DEFAULT_PHOTO_ASPECT
}

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

export function SignPreview({ selection, visual, theme, photos, zoomLabel, signOnlyLabel, loading }: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const [view, setView] = useState<View>({ kind: 'sign' })
  const [zoom, setZoom] = useState(ZOOM.min)
  const [zone, setZone] = useState<Size>({ width: 0, height: 0 })
  const zoneRef = useRef<HTMLDivElement>(null)
  // Punteros activos sobre la zona, para el pinch con dos dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)

  const photo = view.kind === 'photo' ? (photos.find((item) => item.id === view.id) ?? null) : null
  const aspect = usePhotoAspect(photo)

  // Tamano de la zona, para la caja contain del modo vista.
  useEffect(() => {
    const element = zoneRef.current
    if (element === null) {
      return undefined
    }
    const observer = new ResizeObserver(() => {
      setZone({ width: element.clientWidth, height: element.clientHeight })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  // La rueda se escucha a mano para poder cancelar el scroll de la pagina (React la registra
  // pasiva). El pinch del trackpad llega como rueda con ctrl y va por el mismo camino.
  useEffect(() => {
    const element = zoneRef.current
    if (element === null) {
      return undefined
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      setZoom((current) => zoomBy(current, event.deltaY, ZOOM))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
    }
  }, [])

  const options = [
    { key: 'sign', label: signOnlyLabel, active: photo === null, pick: (): View => ({ kind: 'sign' }) },
    ...photos.map((item) => ({
      key: `photo-${item.id}`,
      label: item.label,
      active: photo?.id === item.id,
      pick: (): View => ({ kind: 'photo', id: item.id }),
    })),
  ]

  const box = containBox(zone, aspect)
  // Modo cartel: la caja llena la zona. Modo vista: la caja contain de la foto.
  const stageStyle: CSSProperties =
    photo === null ? { inset: 0 } : { left: box.left, top: box.top, width: box.width, height: box.height }

  function step(direction: 1 | -1): void {
    setZoom((current) => Math.min(ZOOM.max, Math.max(ZOOM.min, current + direction * ZOOM.step)))
  }

  function pinchDistance(): number | null {
    const points = [...pointers.current.values()]
    return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : null
  }

  return (
    <div
      ref={zoneRef}
      data-preview-zone
      style={theme}
      className={`relative h-full w-full touch-none overflow-hidden bg-[var(--q-stage)] ${photo === null ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onPointerDownCapture={(event) => {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        const distance = pinchDistance()
        pinchStart.current = distance === null ? null : { distance, zoom }
      }}
      onPointerMoveCapture={(event) => {
        if (!pointers.current.has(event.pointerId)) {
          return
        }
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        const distance = pinchDistance()
        const start = pinchStart.current
        if (distance !== null && start !== null) {
          setZoom(zoomFromPinch(start.zoom, start.distance, distance, ZOOM))
        }
      }}
      onPointerUpCapture={(event) => {
        pointers.current.delete(event.pointerId)
        pinchStart.current = null
      }}
      onPointerCancelCapture={(event) => {
        pointers.current.delete(event.pointerId)
        pinchStart.current = null
      }}
    >
      <div data-preview-stage className="absolute overflow-hidden rounded-2xl" style={stageStyle}>
        <PhotoStage
          selection={selection}
          visual={visual}
          theme={theme}
          photo={photo}
          reducedMotion={reducedMotion}
          cssZoom={zoom}
          signZoom={signZoomFactor(zoom, ZOOM)}
          loading={loading}
        />
      </div>

      <div
        role="group"
        data-view-selector
        className="q-panel q-hairline absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-7rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border p-1 shadow-sm"
      >
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={option.active}
            className={`${option.active ? 'q-on' : 'text-[var(--q-text)]'} min-h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm`}
            onClick={() => {
              setView(option.pick())
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div data-zoom className="q-panel q-hairline absolute right-3 bottom-3 z-10 flex flex-col overflow-hidden rounded-2xl border shadow-sm">
        <button
          type="button"
          aria-label={`${zoomLabel} +`}
          disabled={zoom >= ZOOM.max}
          className="flex size-9 items-center justify-center text-[var(--q-text)] disabled:opacity-40"
          onClick={() => {
            step(1)
          }}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          aria-label={`${zoomLabel} -`}
          disabled={zoom <= ZOOM.min}
          className="q-hairline flex size-9 items-center justify-center border-t text-[var(--q-text)] disabled:opacity-40"
          onClick={() => {
            step(-1)
          }}
        >
          <MinusIcon />
        </button>
      </div>
    </div>
  )
}
