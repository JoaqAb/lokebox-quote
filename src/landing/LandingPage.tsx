import { useEffect } from 'react'
import { formatCurrency } from '../core/pricing/format'
import { ErrorScreen } from '../pages/ErrorScreen'
import landingJson from './landing.json'
import { PRICE_SLOTS, validateLandingConfig, type LandingConfig } from './landingConfig'
import { themeFromLanding } from './landingTheme'

// Landing en / (SPEC 13). Todo texto visible sale de landing.json: aca no se escribe ninguna
// palabra. No importa three ni el preview, no inserta visitas ni leads, y los botones de demo
// son enlaces nativos a los href del JSON, que la validacion ya cruzo con el registro.
// Si el JSON no valida se muestra ErrorScreen, igual que con un cliente roto.
// Es el unico lugar del producto con identidad Lokebox (D18): el logo horizontal va en el
// encabezado y en el pie, con el nombre de la marca en su alt. Las demos /d/<slug> siguen
// white label con el tema de su JSON.

type Resolution = { ok: true; landing: LandingConfig } | { ok: false; detail: string }

function resolveLanding(): Resolution {
  try {
    return { ok: true, landing: validateLandingConfig(landingJson) }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) }
  }
}

const RESOLVED = resolveLanding()

const SECTION = 'border-t q-hairline py-12 sm:py-16'
const SECTION_TITLE = 'text-2xl font-semibold tracking-tight sm:text-3xl'

type BulletsProps = {
  title: string
  items: string[]
  numbered: boolean
}

// Los pasos van numerados en una lista ordenada; los destinatarios, con un punto en una no
// ordenada. El marcador ocupa el mismo ancho en las dos para que los textos alineen.
function Bullets({ title, items, numbered }: BulletsProps) {
  const List = numbered ? 'ol' : 'ul'
  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{title}</h2>
      <List className="mt-6 flex flex-col gap-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4">
            {numbered ? (
              <span
                aria-hidden="true"
                className="q-panel q-hairline flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold text-[var(--q-accent)]"
              >
                {String(index + 1)}
              </span>
            ) : (
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
                <span className="size-2 rounded-full bg-[var(--q-accent)]" />
              </span>
            )}
            <p className="pt-1 text-base leading-relaxed">{item}</p>
          </li>
        ))}
      </List>
    </section>
  )
}

// Una lista de la oferta. Sin marcador de numero: no son pasos, son cosas que entran.
function OfferList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--q-accent)]" />
          {item}
        </li>
      ))}
    </ul>
  )
}

// La oferta de SPEC 15, en lugar de la tabla de tiers: un precio piso, lo que incluye el
// setup, lo que incluye el abono y lo que se construye por mas. Los dos numeros salen del
// JSON y se formatean con formatCurrency del core, que es el unico lugar del proyecto que
// formatea plata; la frase que los rodea vive entera en texts.offerPrice.
function Offer({ landing }: { landing: LandingConfig }) {
  const { texts, currency, locale, offer } = landing
  const price = texts.offerPrice
    .replace(PRICE_SLOTS.setup, formatCurrency(offer.price.setup, currency, locale))
    .replace(PRICE_SLOTS.monthly, formatCurrency(offer.price.monthly, currency, locale))
  return (
    <section className={SECTION}>
      <h2 className={SECTION_TITLE}>{texts.offerTitle}</h2>
      <p className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">{price}</p>
      <div className="mt-6 flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
        <article className="q-panel q-hairline rounded-2xl border p-6">
          <OfferList items={offer.setup} />
        </article>
        <article className="q-panel q-hairline rounded-2xl border p-6">
          <h3 className="mb-4 text-base font-semibold">{texts.offerMonthlyTitle}</h3>
          <OfferList items={offer.monthly} />
        </article>
      </div>
      <h3 className="mt-8 text-base font-semibold">{texts.offerMoreTitle}</h3>
      <div className="mt-4">
        <OfferList items={offer.more} />
      </div>
    </section>
  )
}

function Landing({ landing }: { landing: LandingConfig }) {
  const { texts, brand } = landing

  useEffect(() => {
    document.title = brand.name
    document.documentElement.lang = landing.locale
  }, [brand.name, landing.locale])

  return (
    <div style={themeFromLanding(landing)} className="min-h-dvh bg-[var(--q-bg)] text-[var(--q-text)]">
      <div className="mx-auto w-full max-w-[960px] px-5 sm:px-8">
        <header className="py-6">
          <img src={brand.logo} alt={brand.name} className="h-7 w-auto sm:h-8" />
        </header>

        <section className="pt-6 pb-12 sm:pt-10 sm:pb-16">
          <h1 className="max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {texts.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--q-muted)]">{texts.subheadline}</p>
          <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-[var(--q-muted)] uppercase">
            {texts.demosTitle}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            {landing.demos.map((demo, index) => (
              <a
                key={demo.id}
                href={demo.href}
                className={`q-control sm:min-w-56 ${index === 0 ? 'q-on' : 'q-off'}`}
              >
                {demo.label}
              </a>
            ))}
          </div>
          <p className="mt-3 max-w-xl text-sm text-[var(--q-muted)]">{texts.demosNote}</p>
        </section>

        <Bullets title={texts.howTitle} items={texts.how} numbered />
        <Bullets title={texts.forWhoTitle} items={texts.forWho} numbered={false} />
        <Offer landing={landing} />

        <section className={SECTION}>
          <h2 className={SECTION_TITLE}>{texts.contactTitle}</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--q-muted)]">{texts.contactBody}</p>
          <a href={`mailto:${landing.contact.email}`} className="q-control q-on mt-6 w-full sm:w-auto sm:min-w-48 sm:inline-flex">
            {texts.contactButton}
          </a>
        </section>

        <footer className="flex flex-col gap-4 border-t q-hairline py-8 sm:flex-row sm:items-center sm:justify-between">
          <img src={brand.logo} alt={brand.name} className="h-6 w-auto" />
          <p className="text-sm text-[var(--q-muted)]">{texts.footer}</p>
        </footer>
      </div>
    </div>
  )
}

export function LandingPage() {
  if (!RESOLVED.ok) {
    return <ErrorScreen detail={RESOLVED.detail} />
  }
  return <Landing landing={RESOLVED.landing} />
}
