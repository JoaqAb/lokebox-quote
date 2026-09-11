import type { ClientConfig } from './types'

// Tema del cliente como variables CSS. Funcion pura, sin React.
// El objeto se aplica una sola vez, en el style del contenedor raiz de la pagina.
// La UI consume estas variables con valores arbitrarios de Tailwind, nunca con hexadecimales.

export function themeFromClient(config: ClientConfig): Record<string, string> {
  const colors = config.brand.colors
  return {
    '--q-bg': colors.bg,
    '--q-primary': colors.primary,
    '--q-accent': colors.accent,
    '--q-text': colors.text,
    '--q-muted': colors.muted,
  }
}
