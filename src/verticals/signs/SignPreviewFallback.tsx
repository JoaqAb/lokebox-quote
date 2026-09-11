import type { SignSelection } from '../../core/types'

// Caida por ausencia de WebGL: el bloque plano de TAREA_002, tal cual.
// No es la degradacion por rendimiento de SPEC 12, que nunca vuelve a 2D.

const FRAME_RATIO = 16 / 9
const MAX_WIDTH_PCT = 76
const MAX_HEIGHT_PCT = 62

type SignPreviewFallbackProps = {
  selection: SignSelection
  theme: Record<string, string>
}

function boxSize(width: number, height: number): { width: number; height: number } {
  const ratio = width / height
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return { width: MAX_WIDTH_PCT, height: MAX_HEIGHT_PCT }
  }
  const widthPct = MAX_WIDTH_PCT
  const heightPct = (widthPct * FRAME_RATIO) / ratio
  if (heightPct <= MAX_HEIGHT_PCT) {
    return { width: widthPct, height: heightPct }
  }
  const scale = MAX_HEIGHT_PCT / heightPct
  return { width: widthPct * scale, height: MAX_HEIGHT_PCT }
}

export function SignPreviewFallback({ selection, theme }: SignPreviewFallbackProps) {
  const box = boxSize(selection.width, selection.height)
  return (
    <div
      style={theme}
      className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[var(--q-primary)]"
    >
      <div
        style={{ width: `${String(box.width)}%`, height: `${String(box.height)}%` }}
        className="rounded-md bg-[var(--q-accent)] transition-all duration-300 ease-out motion-reduce:transition-none"
      />
    </div>
  )
}
