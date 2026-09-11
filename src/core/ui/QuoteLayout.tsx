import type { ReactNode } from 'react'
import { themeFromClient } from '../theme'
import type { ClientConfig } from '../types'

// Layout de SPEC 4.1. No conoce ninguna vertical: recibe preview, panel y precio como nodos.
// Desktop (1024 px o mas): dos columnas, preview a la izquierda con el 58% del ancho,
// panel con scroll propio a la derecha y el bloque de precio al pie de esa columna.
// Menos de 1024 px: una columna, preview 16/9 arriba y barra de precio fija al pie de la ventana.

type QuoteLayoutProps = {
  config: ClientConfig
  preview: ReactNode
  panel: ReactNode
  price: ReactNode
}

export function QuoteLayout({ config, preview, panel, price }: QuoteLayoutProps) {
  const { brand, texts } = config
  return (
    <div
      style={themeFromClient(config)}
      className="flex min-h-dvh flex-col bg-[var(--q-bg)] text-[var(--q-text)] lg:h-dvh lg:overflow-hidden"
    >
      <header className="shrink-0 border-b border-white/5 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src={brand.logo} alt={brand.name} className="h-8 w-auto" />
          <span className="text-sm font-medium text-[var(--q-muted)]">{brand.name}</span>
        </div>
        <h1 className="mt-3 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          {texts.headline}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--q-muted)] sm:text-base">
          {texts.subheadline}
        </p>
      </header>

      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="shrink-0 p-4 sm:p-6 lg:w-[58%] lg:p-8">{preview}</div>

        <div className="flex flex-1 flex-col lg:min-h-0 lg:border-l lg:border-white/5">
          <div className="px-4 pb-[calc(13rem+env(safe-area-inset-bottom))] sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:pb-8">
            {panel}
            {config.poweredBy ? (
              <footer className="mt-10 pb-4 text-xs text-[var(--q-muted)]">{texts.poweredBy}</footer>
            ) : null}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 lg:static lg:z-auto lg:shrink-0">{price}</div>
        </div>
      </main>
    </div>
  )
}
