import type { VerticalViewProps } from '../../core/vertical'
import { BoxPreview } from './BoxPreview'
import type { BoxSelection, BoxesConfig } from './types'
import { resolveBoxVisual } from './visuals'

// La vista de la vertical cajas (SPEC 4.4 y 21.5): la entrada que el registro de src/app carga con
// React.lazy. Calcula el visual en el render, sobre la misma seleccion que el precio, y le pasa al
// preview el logo del cliente (D144), que la impresion pone en la caja.

export function BoxesView({ config, selection, theme, loading, logo }: VerticalViewProps<BoxesConfig, BoxSelection>) {
  const { texts } = config
  return (
    <BoxPreview
      visual={resolveBoxVisual(config, selection)}
      theme={theme}
      logo={logo}
      labels={{ closed: texts.viewClosed, open: texts.viewOpen, zoom: texts.previewZoomLabel }}
      loading={loading}
    />
  )
}
