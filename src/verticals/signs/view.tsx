import { useSearchParams } from 'react-router-dom'
import type { VerticalViewProps } from '../../core/vertical'
import { CalibrationPreview } from './calibration/CalibrationPreview'
import { SignPreview } from './SignPreview'
import type { SignSelection, SignsConfig } from './types'
import { resolveSignVisual } from './visuals'

// La vista de la vertical carteleria (SPEC 4.4): la entrada que el registro de src/app carga con
// React.lazy. Envuelve a SignPreview, que conserva la interfaz de SPEC 12, y calcula el visual de
// la escena en el render, sobre la misma seleccion que el precio.
// El modo de calibracion es de desarrollo: import.meta.env.DEV vale false en el build de
// produccion, asi que esa rama y su modulo quedan fuera del bundle. Hasta la version 2.12 se
// decidia en QuotePage. El logo del contrato (D144) no se usa: carteles no lo dibuja.

export function SignsView({ config, selection, theme, loading }: VerticalViewProps<SignsConfig, SignSelection>) {
  const [searchParams] = useSearchParams()
  const visual = resolveSignVisual(config, selection)
  if (import.meta.env.DEV && searchParams.get('calibrate') === '1') {
    return (
      // En lg el area del preview tiene alto fijo desde la version 2.8 (D90), y por debajo de lg
      // el alto lo da el preview desde 2.9 (D98): la herramienta toma 42svh y scrollea.
      <div className="h-[42svh] overflow-y-auto p-4 lg:h-full">
        <CalibrationPreview selection={selection} visual={visual} theme={theme} photos={config.photos} loading={loading} />
      </div>
    )
  }
  return (
    <SignPreview
      selection={selection}
      visual={visual}
      theme={theme}
      photos={config.photos}
      zoomLabel={config.texts.previewZoomLabel}
      signOnlyLabel={config.texts.viewSignOnly}
      loading={loading}
    />
  )
}
