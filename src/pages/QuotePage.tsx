import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getClient } from '../clients'
import { defaultSelection, priceRulesFromClient } from '../core/clientConfig'
import { insertRow } from '../core/data/insertRow'
import { useVisitOnce } from '../core/data/useVisitOnce'
import { buildLeadRow, type LeadContact } from '../core/lead/leadRow'
import { buildWhatsappMessage } from '../core/lead/whatsapp'
import { calculatePrice } from '../core/pricing/calculatePrice'
import { themeFromClient } from '../core/theme'
import { LeadSection } from '../core/ui/LeadSection'
import { OptionsPanel } from '../core/ui/OptionsPanel'
import { PriceBar } from '../core/ui/PriceBar'
import { PriceBreakdown } from '../core/ui/PriceBreakdown'
import { QuoteLayout } from '../core/ui/QuoteLayout'
import type { SelectionValue } from '../core/ui/panelTypes'
import type { ClientConfig } from '../core/types'
import { SignPreview } from '../verticals/signs/SignPreview'
import { selectionFromValues, signFields, valuesFromSelection } from '../verticals/signs/fields'
import { signLeadSelection, signLeadTokens } from '../verticals/signs/leadTokens'
import { resolveSignVisual } from '../verticals/signs/visuals'
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

  // Una visita por sesion y por slug. No espera el insert y no renderiza nada.
  useVisitOnce(config.slug)

  // Sin useEffect, sin debounce y sin estado derivado: el precio y el visual de la
  // escena se calculan en el render, sobre la misma seleccion.
  const selection = selectionFromValues(values)
  const result = calculatePrice(rules, selection)
  const visual = resolveSignVisual(config, selection)

  // El mensaje de WhatsApp se arma aca: la vertical traduce ids a etiquetas y el core
  // solo reemplaza los placeholders de la plantilla del cliente.
  const tokens = signLeadTokens(config, selection, result)
  const whatsappMessage = buildWhatsappMessage(config.texts.whatsappMessage, tokens)

  function handleChange(fieldId: string, value: SelectionValue): void {
    setValues((current) => ({ ...current, [fieldId]: value }))
  }

  // El insert se dispara y no se espera: el navegador abre wa.me con el gesto del click.
  function handleWhatsappClick(): void {
    void insertRow(
      'leads',
      buildLeadRow({
        clientSlug: config.slug,
        channel: 'whatsapp',
        selection: signLeadSelection(config, selection),
        result,
      }),
    )
  }

  async function handleSubmitForm(contact: LeadContact): Promise<void> {
    await insertRow(
      'leads',
      buildLeadRow({
        clientSlug: config.slug,
        channel: 'form',
        selection: signLeadSelection(config, selection),
        result,
        contact,
      }),
    )
  }

  return (
    <QuoteLayout
      config={config}
      preview={<SignPreview selection={selection} visual={visual} theme={theme} />}
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
          <LeadSection
            cta={config.cta}
            texts={config.texts}
            whatsappNumber={config.brand.whatsapp}
            whatsappMessage={whatsappMessage}
            onSubmitForm={handleSubmitForm}
            onWhatsappClick={handleWhatsappClick}
          />
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
