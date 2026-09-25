import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { PreviewCanvas } from '../../core/preview/PreviewCanvas'
import { PreviewStrip } from '../../core/preview/PreviewControls'
import { disposeFinishTextures } from '../../core/preview/finishTextures'
import { CONTROL_STRIP, usePreviewZoom } from '../../core/preview/previewZoom'
import { PREVIEW_ZOOM, studioZoomFactor } from '../../core/preview/studioView'
import { disposeSupportShadow } from '../../core/preview/supportShadow'
import { themeColor } from '../../core/preview/themeColor'
import { hasWebGL } from '../../core/preview/webgl'
import type { LoadingBrand } from '../../core/ui/LoadingScreen'
import { StageBackdrop } from '../../core/ui/StageBackdrop'
import { BoxScene } from './scene/BoxScene'
import { useLogoTextures } from './scene/logoTexture'
import type { BoxVisual } from './visuals'

// El preview de cajas (SPEC 21.5): solo estudio, sobre el escenario del core, con la franja de
// controles del core: el control segmentado abre y cierra la caja, cerrada al cargar, y el zoom
// acerca la camara. Abierta o cerrada no es seleccion: no cambia el precio ni va a la URL ni al
// lead. Por debajo de lg el alto es 3/4 del ancho, con el tope de 42svh (D98).

type BoxPreviewProps = {
  visual: BoxVisual
  theme: Record<string, string>
  logo: string
  labels: { closed: string; open: string; zoom: string }
  loading: LoadingBrand
}

const ACCENT_KEY = '--q-accent'

export function BoxPreview({ visual, theme, logo, labels, loading }: BoxPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const [open, setOpen] = useState(false)
  const zoneRef = useRef<HTMLDivElement>(null)
  const { zoom, step, pointerHandlers } = usePreviewZoom(zoneRef)
  const accent = useMemo(() => `#${themeColor(theme, ACCENT_KEY).getHexString()}`, [theme])
  const logoTextures = useLogoTextures(logo, accent)

  // La sombra y los mapas de los acabados viven mientras vive la escena.
  useEffect(
    () => () => {
      disposeSupportShadow()
      disposeFinishTextures()
    },
    [],
  )

  const options = [
    {
      key: 'closed',
      label: labels.closed,
      active: !open,
      onSelect: () => {
        setOpen(false)
      },
    },
    {
      key: 'open',
      label: labels.open,
      active: open,
      onSelect: () => {
        setOpen(true)
      },
    },
  ]
  const zoneStyle = { ...theme, '--q-strip': CONTROL_STRIP } as CSSProperties

  return (
    <div
      ref={zoneRef}
      data-preview-zone
      style={zoneStyle}
      className="relative h-[min(42svh,75cqw)] w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing lg:h-full"
      {...pointerHandlers}
    >
      <StageBackdrop tone={loading.stage} lit={false} />
      <div data-preview-stage className="absolute inset-0">
        {hasWebGL() ? (
          <PreviewCanvas loading={loading}>
            <BoxScene
              visual={visual}
              accent={accent}
              logo={logoTextures}
              open={open}
              zoom={studioZoomFactor(zoom, PREVIEW_ZOOM)}
              reducedMotion={reducedMotion}
            />
          </PreviewCanvas>
        ) : null}
      </div>
      <PreviewStrip options={options} zoom={zoom} onStep={step} zoomLabel={labels.zoom} />
    </div>
  )
}
