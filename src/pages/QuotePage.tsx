import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getClient } from '../clients'
import { defaultSelection, priceRulesFromClient } from '../core/clientConfig'
import { calculatePrice } from '../core/pricing/calculatePrice'
import { themeFromClient } from '../core/theme'
import { OptionsPanel } from '../core/ui/OptionsPanel'
import { PriceBar } from '../core/ui/PriceBar'
import { PriceBreakdown } from '../core/ui/PriceBreakdown'
import { QuoteLayout } from '../core/ui/QuoteLayout'
import type { SelectionValue } from '../core/ui/panelTypes'
import type { ClientConfig } from '../core/types'
import { SignPreview } from '../verticals/signs/SignPreview'
import { selectionFromValues, signFields, valuesFromSelection } from '../verticals/signs/fields'
import { ErrorScreen } from './ErrorScreen'

// Punto de composicion: es el unico lugar que decide vertical y que junta core,
// vertical y cliente. Si el cliente no existe o su config no valida, se muestra
// ErrorScreen y no se renderiza el cotizador a medias (SPEC 10).

const SIGNS_VERTICAL = 'signs'

type Resolution = { ok: true; config: ClientConfig } | { ok: false; detail: string }

function resolveClient(slug: string): Resolution {
  try {
    const config = getClient(slug)
    if (config === null) {
      return { ok: false, detail: `/d/${slug}` }
    }
    if (config.vertical !== SIGNS_VERTICAL) {
      return { ok: false, detail: `/d/${slug}: vertical "${config.vertical}"` }
    }
    return { ok: true, config }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) }
  }
}

type QuoteScreenProps = {
  config: ClientConfig
}

function QuoteScreen({ config }: QuoteScreenProps) {
  const [values, setValues] = useState<Record<string, SelectionValue>>(() =>
    valuesFromSelection(defaultSelection(config)),
  )
  const fields = useMemo(() => signFields(config), [config])
  const rules = useMemo(() => priceRulesFromClient(config), [config])
  const theme = useMemo(() => themeFromClient(config), [config])

  const brandName = config.brand.name
  useEffect(() => {
    document.title = brandName
  }, [brandName])

  // Sin useEffect, sin debounce y sin estado derivado: el precio se calcula en el render.
  const selection = selectionFromValues(values)
  const result = calculatePrice(rules, selection)

  function handleChange(fieldId: string, value: SelectionValue): void {
    setValues((current) => ({ ...current, [fieldId]: value }))
  }

  return (
    <QuoteLayout
      config={config}
      preview={<SignPreview selection={selection} theme={theme} />}
      panel={
        <>
          <OptionsPanel
            title={config.texts.configureTitle}
            fields={fields}
            values={values}
            texts={config.texts}
            onChange={handleChange}
          />
          <PriceBreakdown result={result} config={config} />
        </>
      }
      price={<PriceBar result={result} config={config} />}
    />
  )
}

export function QuotePage() {
  const params = useParams()
  const slug = params.slug ?? ''
  const resolved = resolveClient(slug)
  if (!resolved.ok) {
    return <ErrorScreen detail={resolved.detail} />
  }
  // La key reinicia el estado del cotizador cuando se pasa de un cliente a otro.
  return <QuoteScreen key={slug} config={resolved.config} />
}
