import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { PREVIEW_ZOOM, zoomBy, zoomFromPinch } from './studioView'

// Zoom del preview (SPEC 12, D92): rueda, pinch del trackpad, pinch con dos dedos y los pasos de
// los botones + y - de la franja de controles (PreviewControls). En el core desde TAREA_033 (D143).

// Alto de la franja de controles: el selector y el zoom miden 46 px con su borde.
export const CONTROL_STRIP = '3.5rem'

export type PreviewZoom = {
  zoom: number
  step: (direction: 1 | -1) => void
  // Van en la zona del preview: siguen los punteros para el pinch con dos dedos.
  pointerHandlers: {
    onPointerDownCapture: (event: PointerEvent) => void
    onPointerMoveCapture: (event: PointerEvent) => void
    onPointerUpCapture: (event: PointerEvent) => void
    onPointerCancelCapture: (event: PointerEvent) => void
  }
}

// Zoom del preview sobre la zona: rueda, pinch y pasos, siempre dentro de PREVIEW_ZOOM.
export function usePreviewZoom(zoneRef: RefObject<HTMLElement | null>): PreviewZoom {
  const [zoom, setZoom] = useState<number>(PREVIEW_ZOOM.min)
  // Punteros activos sobre la zona, para el pinch con dos dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)

  // La rueda se escucha a mano para poder cancelar el scroll de la pagina (React la registra
  // pasiva). El pinch del trackpad llega como rueda con ctrl y va por el mismo camino.
  useEffect(() => {
    const element = zoneRef.current
    if (element === null) {
      return undefined
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      setZoom((current) => zoomBy(current, event.deltaY, PREVIEW_ZOOM))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
    }
  }, [zoneRef])

  function pinchDistance(): number | null {
    const points = [...pointers.current.values()]
    return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : null
  }

  return {
    zoom,
    step(direction) {
      setZoom((current) => Math.min(PREVIEW_ZOOM.max, Math.max(PREVIEW_ZOOM.min, current + direction * PREVIEW_ZOOM.step)))
    },
    pointerHandlers: {
      onPointerDownCapture(event) {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        const distance = pinchDistance()
        pinchStart.current = distance === null ? null : { distance, zoom }
      },
      onPointerMoveCapture(event) {
        if (!pointers.current.has(event.pointerId)) {
          return
        }
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        const distance = pinchDistance()
        const start = pinchStart.current
        if (distance !== null && start !== null) {
          setZoom(zoomFromPinch(start.zoom, start.distance, distance, PREVIEW_ZOOM))
        }
      },
      onPointerUpCapture(event) {
        pointers.current.delete(event.pointerId)
        pinchStart.current = null
      },
      onPointerCancelCapture(event) {
        pointers.current.delete(event.pointerId)
        pinchStart.current = null
      },
    },
  }
}
