import type { ClientConfig } from './types'

// Tema del cliente como variables CSS. Funcion pura, sin React.
// El objeto se aplica una sola vez, en el style del contenedor raiz de la pagina.
// La UI consume estas variables con valores arbitrarios de Tailwind, nunca con hexadecimales.
//
// Cinco variables salen del JSON y tres se derivan con color-mix (SPEC 4.1). Se derivan y
// no se escriben fijas porque una opacidad de blanco, tipo bg-white/5, es invisible sobre
// un fondo claro: la mezcla del texto sobre el fondo funciona igual en los dos temas y
// no obliga a duplicar cada control ni a usar variantes dark:.

// Cuanto del color de texto entra en cada derivada. La superficie apenas se despega del
// fondo; el borde tiene que verse sin gritar.
// Se exportan junto con mix para la landing (SPEC 13), que deriva superficie y borde igual
// sin duplicar los porcentajes. core no importa nada de la landing.
export const SURFACE_MIX_PCT = 6
export const BORDER_MIX_PCT = 16
// El escenario del modo cartel (SPEC 12, version 1.16) va casi en el color del texto: el marco
// es un escenario y tiene que contrastar con un cartel de material claro, que sobre la
// superficie casi no se despegaba. Por eso es tan alta.
const STAGE_MIX_PCT = 82

export function mix(pct: number): string {
  return `color-mix(in srgb, var(--q-text) ${String(pct)}%, var(--q-bg))`
}

export function themeFromClient(config: ClientConfig): Record<string, string> {
  const colors = config.brand.colors
  return {
    '--q-bg': colors.bg,
    '--q-primary': colors.primary,
    '--q-accent': colors.accent,
    '--q-text': colors.text,
    '--q-muted': colors.muted,
    '--q-surface': mix(SURFACE_MIX_PCT),
    '--q-border': mix(BORDER_MIX_PCT),
    '--q-stage': mix(STAGE_MIX_PCT),
  }
}
