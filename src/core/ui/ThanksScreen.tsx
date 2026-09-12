import type { ClientTexts } from '../types'

// Cierre del flujo. Se llega aca gane o pierda el insert (SPEC 7.3).

type ThanksScreenProps = {
  texts: ClientTexts
  quoteHref?: string
}

export function ThanksScreen({ texts, quoteHref }: ThanksScreenProps) {
  return (
    <div className="rounded-2xl border border-[var(--q-accent)] bg-white/5 p-5">
      <p className="text-lg font-semibold">{texts.thanksTitle}</p>
      <p className="mt-1 text-sm text-[var(--q-muted)]">{texts.thanksBody}</p>
      {quoteHref === undefined ? null : (
        <a
          href={quoteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="q-control q-off mt-4 w-full"
        >
          {texts.viewQuote}
        </a>
      )}
    </div>
  )
}
