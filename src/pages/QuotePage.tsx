import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { priceDisplayOf } from '../core/clientConfig'
import { insertRow } from '../core/data/insertRow'
import { useVisitOnce } from '../core/data/useVisitOnce'
import { buildLeadRow, type LeadContact } from '../core/lead/leadRow'
import { stageToneOf, themeFromClient } from '../core/theme'
import { LeadSection } from '../core/ui/LeadSection'
import { LoadingScreen } from '../core/ui/LoadingScreen'
import { OptionsPanel } from '../core/ui/OptionsPanel'
import { PriceBar } from '../core/ui/PriceBar'
import { PriceBreakdown } from '../core/ui/PriceBreakdown'
import { QuoteLayout } from '../core/ui/QuoteLayout'
import { useHtmlLang } from '../core/ui/useHtmlLang'
import type { SelectionValue } from '../core/ui/panelTypes'
import { ErrorScreen } from './ErrorScreen'
import { resolveClient, type ResolvedClient } from './resolveClient'

// El cotizador: la pagina /d/<slug>, la misma para toda vertical (SPEC 4.4, D133). Junta el core
// con la vertical del cliente solo por el contrato: no importa nada de src/verticals. La
// resolucion del cliente vive en ./resolveClient, compartida con QuoteSheetPage.

function QuoteScreen({ config, vertical, verticalConfig }: ResolvedClient) {
  const { logic, View } = vertical
  const [values, setValues] = useState<Record<string, SelectionValue>>(() =>
    logic.valuesFromSelection(logic.defaultSelection(verticalConfig)),
  )
  // El modo de visibilidad de SPEC 6.2 se lee del config una sola vez y baja como prop:
  // sin contexto y sin estado global. Es config, no estado: no cambia mientras se navega.
  const display = useMemo(() => priceDisplayOf(config), [config])
  const theme = useMemo(() => themeFromClient(config), [config])

  const brandName = config.brand.name
  const loading = useMemo(
    () => ({
      logo: config.brand.logo,
      brandName: config.brand.name,
      label: config.texts.loadingLabel,
      stage: stageToneOf(config.brand.colors.bg),
    }),
    [config],
  )
  useEffect(() => {
    document.title = brandName
  }, [brandName])

  useHtmlLang(config.locale)

  // Una visita por sesion y por slug. No espera el insert y no renderiza nada.
  useVisitOnce(config.slug)

  // Sin useEffect, sin debounce y sin estado derivado: el precio se calcula en el render, sobre
  // la misma seleccion que recibe la vista.
  const selection = logic.selectionFromValues(values)
  const result = logic.price(verticalConfig, selection)
  // Los controles dependen de la seleccion: la vertical decide cuales van.
  const fields = logic.panelFields(verticalConfig, selection)

  // El mensaje de WhatsApp lo arma la vertical, con la plantilla y los tokens de su rubro.
  // Solo si el CTA incluye WhatsApp: en hidden la plantilla sin precio es obligatoria solo con
  // WhatsApp (SPEC 10), y un cliente hidden con cta form no la trae (TAREA_028).
  const whatsappMessage = config.cta === 'form' ? '' : logic.whatsappMessage(verticalConfig, selection, result, display)

  // La hoja se abre con un enlace nativo, no con window.open: asi el navegador no lo
  // bloquea y la pestana del cotizador conserva el estado del visitante.
  const quoteHref = `/d/${config.slug}/quote?${logic.encodeQuery(verticalConfig, selection)}`

  function handleChange(fieldId: string, value: SelectionValue): void {
    setValues((current) => logic.applyFieldChange(verticalConfig, current, fieldId, value))
  }

  // El insert se dispara y no se espera: el navegador abre wa.me con el gesto del click.
  function handleWhatsappClick(): void {
    void insertRow(
      'leads',
      buildLeadRow({
        clientSlug: config.slug,
        channel: 'whatsapp',
        selection: logic.leadSelection(verticalConfig, selection),
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
        selection: logic.leadSelection(verticalConfig, selection),
        result,
        contact,
      }),
    )
  }

  return (
    <QuoteLayout
      config={config}
      preview={
        // La vista llega con React.lazy (D121). Mientras baja, la pantalla de carga del core ocupa
        // el area del preview sobre el escenario del tema, la misma que muestra la vista hasta que
        // la escena dibuja.
        <Suspense
          fallback={
            <div className="relative h-[42svh] w-full lg:h-full">
              <LoadingScreen brand={loading} done={false} />
            </div>
          }
        >
          <View config={verticalConfig} selection={selection} theme={theme} loading={loading} />
        </Suspense>
      }
      panel={
        <>
          <OptionsPanel
            title={config.texts.configureTitle}
            fields={fields}
            values={values}
            texts={config.texts}
            locale={config.locale}
            onChange={handleChange}
          />
          {/* En hidden no se muestra precio en ninguna parte del cotizador: ni el
              desglose ni el bloque de abajo. La salida es el pedido estructurado. */}
          {display === 'hidden' ? null : (
            <PriceBreakdown
              result={result}
              texts={config.texts}
              currency={config.currency}
              locale={config.locale}
              caption={logic.breakdownCaption(verticalConfig, result)}
              lineDetail={(line) => logic.lineDetail(verticalConfig, line)}
            />
          )}
        </>
      }
      price={display === 'hidden' ? undefined : <PriceBar result={result} config={config} display={display} />}
      cta={
        <LeadSection
          cta={config.cta}
          texts={config.texts}
          whatsappNumber={config.brand.whatsapp}
          whatsappMessage={whatsappMessage}
          onSubmitForm={handleSubmitForm}
          onWhatsappClick={handleWhatsappClick}
          quoteHref={quoteHref}
        />
      }
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
  return (
    <QuoteScreen
      key={slug}
      config={resolved.config}
      vertical={resolved.vertical}
      verticalConfig={resolved.verticalConfig}
    />
  )
}
