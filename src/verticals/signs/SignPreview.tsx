import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ClientPhoto, SignSelection } from '../../core/types'
import type { LoadingBrand } from '../../core/ui/LoadingScreen'
import { StageBackdrop } from '../../core/ui/StageBackdrop'
import { PhotoStage } from './PhotoStage'
import { containBox, signZoomFactor, zoomBy, zoomFromPinch } from './scene/sceneGeometry'
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
// Desde la version 2.9:
// - D98, D100: selector y zoom van en una franja al pie de la zona, --q-strip de alto, y nunca
//   encima de la foto. La caja contain de vista se calcula sobre un area de ajuste: la zona menos
//   la franja, y en lg ademas menos 24 px por lado. Ese margen lo pone CSS y el area se mide con
//   ResizeObserver: la vertical no repite el breakpoint del core. El modo cartel no cambia.
//   En la franja el selector va al centro entre dos rellenos de base 0; el de la derecha no baja
//   del ancho del zoom, asi en una pantalla angosta el selector se corre a la izquierda antes de
//   tocarlo, y solo si tampoco entra scrollea.
// - D98: por debajo de lg la zona mide el ancho dividido por la proporcion de la foto mas la
//   franja, con tope de 42svh; el ancho sale de 100cqw del area del core. La proporcion es la de
//   la foto elegida, o en modo cartel la de la ultima elegida o la primera: cambiar de modo no
//   cambia el alto.
// Desde la version 2.10:
// - D103, D105: el fondo es el escenario del core (StageBackdrop), claro, y grafito en modo cartel
//   con el cartel encendido. La franja de controles queda sobre el mismo fondo.
// Desde la version 2.13 (D132) el tono del escenario lo da el core con la pantalla de carga: con un
// tema oscuro es grafito fijo en los dos modos.
// - D107: en lg la foto de vista lleva radio de 14 px y sombra suave hacia abajo; en mobile va a
//   todo el ancho, sin radio ni sombra.

const ZOOM = { min: 1, max: 2.5, step: 0.25 }

// Proporcion de una foto hasta que carga: la de las fotos de la demo.
const DEFAULT_PHOTO_ASPECT = 16 / 9

// Alto de la franja de controles: el selector y el zoom miden 46 px con su borde.
const CONTROL_STRIP = '3.5rem'

type Box = { left: number; top: number; width: number; height: number }

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
  const [fit, setFit] = useState<Box>({ left: 0, top: 0, width: 0, height: 0 })
  // La ultima foto elegida: da la proporcion del alto mobile tambien en modo cartel.
  const [lastPhotoId, setLastPhotoId] = useState<string | null>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  // Punteros activos sobre la zona, para el pinch con dos dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)

  const photo = view.kind === 'photo' ? (photos.find((item) => item.id === view.id) ?? null) : null
  const framePhoto = photo ?? photos.find((item) => item.id === lastPhotoId) ?? photos.at(0) ?? null
  const aspect = usePhotoAspect(framePhoto)

  // El area de ajuste, relativa a la zona, para la caja contain del modo vista. Se mide con
  // getBoundingClientRect y no con offset: los offset son enteros y la caja tiene que seguir el
  // rectangulo real para el anclaje.
  useEffect(() => {
    const zoneElement = zoneRef.current
    const fitElement = fitRef.current
    if (zoneElement === null || fitElement === null) {
      return undefined
    }
    const measure = (): void => {
      const outer = zoneElement.getBoundingClientRect()
      const inner = fitElement.getBoundingClientRect()
      setFit({ left: inner.left - outer.left, top: inner.top - outer.top, width: inner.width, height: inner.height })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(zoneElement)
    observer.observe(fitElement)
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
    { key: 'sign', label: signOnlyLabel, active: photo === null, photoId: null, pick: (): View => ({ kind: 'sign' }) },
    ...photos.map((item) => ({
      key: `photo-${item.id}`,
      label: item.label,
      active: photo?.id === item.id,
      photoId: item.id,
      pick: (): View => ({ kind: 'photo', id: item.id }),
    })),
  ]

  const box = containBox(fit, aspect)
  // Modo cartel: la caja llena la zona. Modo vista: la caja contain de la foto en el area de ajuste.
  // La posicion va a pixel entero: centrada en el area puede caer en medio pixel, y la foto se
  // dibujaria remuestreada y blanda. El tamano no se toca, asi la proporcion sigue siendo la de la foto.
  const stageStyle: CSSProperties =
    photo === null
      ? { inset: 0 }
      : { left: Math.round(fit.left + box.left), top: Math.round(fit.top + box.top), width: box.width, height: box.height }
  const zoneStyle = { ...theme, '--q-photo-aspect': String(aspect), '--q-strip': CONTROL_STRIP } as CSSProperties

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
      style={zoneStyle}
      className={`relative h-[min(42svh,calc(100cqw/var(--q-photo-aspect)_+_var(--q-strip)))] w-full touch-none lg:h-full overflow-hidden ${photo === null ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
      <StageBackdrop tone={loading.stage} lit={photo === null && visual.lighting.mode !== 'none'} />

      <div ref={fitRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bottom-[var(--q-strip)] lg:inset-x-6 lg:top-6" />

      <div
        data-preview-stage
        className={`absolute overflow-hidden lg:rounded-[14px] ${photo === null ? '' : 'lg:shadow-[0_18px_36px_-18px_rgb(40_32_24/0.45),0_4px_10px_-4px_rgb(40_32_24/0.18)]'}`}
        style={stageStyle}
      >
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
              onClick={() => {
                setView(option.pick())
                if (option.photoId !== null) {
                  setLastPhotoId(option.photoId)
                }
              }}
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
              disabled={zoom <= ZOOM.min}
              className="flex size-9 items-center justify-center text-[var(--q-text)] disabled:opacity-40"
              onClick={() => {
                step(-1)
              }}
            >
              <MinusIcon />
            </button>
            <button
              type="button"
              aria-label={`${zoomLabel} +`}
              disabled={zoom >= ZOOM.max}
              className="q-hairline flex size-9 items-center justify-center border-l text-[var(--q-text)] disabled:opacity-40"
              onClick={() => {
                step(1)
              }}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
