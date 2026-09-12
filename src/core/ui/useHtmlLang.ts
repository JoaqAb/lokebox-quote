import { useEffect } from 'react'

// El idioma del documento sale del locale del cliente, no del HTML estatico.
// Lo llaman el cotizador y la hoja de cotizacion.

export function useHtmlLang(locale: string): void {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
}
