import { createContext, useContext, useLayoutEffect, useState, type RefObject } from 'react'

// Franja de controles sobre el canvas (SPEC 12 desde 2.17, D155 y D160). En el modo de estudio la
// franja de PreviewControls se superpone al pie del canvas; el encuadre descuenta lo que tapa. El
// alto se mide: nunca es una constante, porque lo decide el CSS de la franja y el de la zona de
// cada vertical. Lo mide PreviewCanvas y lo lee studioFraming por contexto, que R3F lleva adentro
// del Canvas.

type Rect = { top: number; bottom: number }

// Pixeles CSS del canvas que tapa la franja: el tramo vertical en comun, 0 si no se tocan (en modo
// vista la foto va arriba de la franja).
export function stripOverlap(canvas: Rect, strip: Rect): number {
  return Math.max(0, Math.min(canvas.bottom, strip.bottom) - Math.max(canvas.top, strip.top))
}

export const StripOverlapContext = createContext(0)

export function useStripOverlap(): number {
  return useContext(StripOverlapContext)
}

// Mide la franja de la zona del preview que contiene al canvas ([data-preview-zone] con la
// [data-controls] de PreviewStrip) con ResizeObserver sobre el canvas y la franja. Sin franja en la
// zona, 0.
export function useMeasuredStrip(canvasRef: RefObject<HTMLCanvasElement | null>): number {
  const [overlap, setOverlap] = useState(0)
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const strip = canvas?.closest('[data-preview-zone]')?.querySelector('[data-controls]') ?? null
    if (canvas === null || canvas === undefined || strip === null) {
      return
    }
    const measure = () => {
      setOverlap(stripOverlap(canvas.getBoundingClientRect(), strip.getBoundingClientRect()))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    observer.observe(strip)
    measure()
    return () => {
      observer.disconnect()
    }
  }, [canvasRef])
  return overlap
}
