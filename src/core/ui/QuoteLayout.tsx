import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { themeFromClient } from '../theme'
import type { ClientConfig } from '../types'

// Layout de SPEC 4.1, version 2.9 (D90, D93, D95, D98, D99). No conoce ninguna vertical: recibe preview,
// panel, precio y CTA como nodos.
// - Header compacto en una linea: logo, titulo y subtitulo mas chico. El nombre de la marca no se
//   repite al lado del logo: viaja en el alt de la imagen. Por debajo de lg (D99) sale el
//   subtitulo y el titulo baja a dos lineas como maximo, en un tamano menor, sin truncar.
// - Desktop (1024 px o mas): el preview ocupa todo el ancho menos el panel y todo el alto util
//   (100dvh menos el header). El panel mide 400 px, con scroll propio, y deja fijos al pie el precio
//   y el CTA.
// - Menos de 1024 px: el preview queda arriba, sticky, y el panel scrollea debajo. La barra fija
//   al pie lleva precio y CTA. El alto del preview lo da el preview (D98), con tope de 42svh: el
//   area es un contenedor de consulta, asi el preview puede derivar su alto del ancho que le toca.
// El relleno inferior del panel en mobile se deriva de la altura real de la barra, medida con
// ResizeObserver y publicada en --q-price-h: la barra crece si el disclaimer ocupa mas de una linea
// o si se abre el formulario, y un valor fijo tapaba el ultimo control.
// El contenedor de scroll del panel desvanece sus ultimos 24 px con .q-scroll-fade (D24), solo en
// lg, que es donde ese contenedor es el que scrollea. El bloque de pie lleva .q-price-edge.
// En el modo hidden de SPEC 6.2 no hay precio: price llega undefined y el bloque de pie lleva solo
// el CTA.

type QuoteLayoutProps = {
  config: ClientConfig
  preview: ReactNode
  panel: ReactNode
  price?: ReactNode
  cta: ReactNode
}

export function QuoteLayout({ config, preview, panel, price, cta }: QuoteLayoutProps) {
  const { brand, texts } = config
  const rootRef = useRef<HTMLDivElement>(null)
  const footRef = useRef<HTMLDivElement>(null)
  const themeStyle = useMemo(() => themeFromClient(config), [config])

  useEffect(() => {
    const root = rootRef.current
    const foot = footRef.current
    if (root === null || foot === null) {
      return undefined
    }
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--q-price-h', `${String(foot.offsetHeight)}px`)
    })
    // Border box: lo que se mide con offsetHeight, y lo unico que cambia si la barra suma
    // padding, por ejemplo el safe area de un telefono.
    observer.observe(foot, { box: 'border-box' })
    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      style={themeStyle}
      className="flex min-h-dvh flex-col bg-[var(--q-bg)] text-[var(--q-text)] lg:h-dvh lg:overflow-hidden"
    >
      <header className="q-hairline flex shrink-0 items-center gap-3 border-b px-4 py-2.5 sm:px-6 lg:gap-4">
        <img src={brand.logo} alt={brand.name} className="h-7 w-auto shrink-0" />
        <h1 className="min-w-0 text-sm leading-snug font-semibold tracking-tight text-balance sm:text-base lg:shrink-0 lg:truncate lg:text-lg lg:leading-tight">
          {texts.headline}
        </h1>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-[var(--q-muted)] lg:block">{texts.subheadline}</p>
      </header>

      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div
          data-preview-area
          className="@container sticky top-0 z-10 max-h-[42svh] shrink-0 lg:static lg:max-h-none lg:min-h-0 lg:min-w-0 lg:flex-1"
        >
          {preview}
        </div>

        <aside
          data-panel
          className="flex flex-1 flex-col lg:min-h-0 lg:w-[400px] lg:flex-none lg:shrink-0 lg:q-hairline lg:border-l"
        >
          <div className="q-scroll-fade px-4 pb-[calc(var(--q-price-h,12rem)+2rem+env(safe-area-inset-bottom))] sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-8">
            {panel}
            {config.poweredBy ? (
              <footer className="mt-10 pb-4 text-xs text-[var(--q-muted)]">{texts.poweredBy}</footer>
            ) : null}
          </div>

          <div
            ref={footRef}
            data-price-foot
            className="q-hairline q-panel q-price-edge fixed inset-x-0 bottom-0 z-20 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 lg:static lg:z-auto lg:shrink-0 lg:pb-4"
          >
            {price}
            {cta}
          </div>
        </aside>
      </main>
    </div>
  )
}
