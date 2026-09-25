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

// Tono del escenario del preview (SPEC 12, version 2.13, D132). Con un tema oscuro el escenario
// es grafito en los dos modos desde la carga y no cambia con la iluminacion: el estudio claro al
// lado de un panel oscuro se leia como otro producto. Se deriva del fondo del tema, sin campo
// nuevo en el JSON. El umbral es el de D132 sobre la luminancia relativa de WCAG.
export type StageTone = 'light' | 'dark'

export const DARK_THEME_LUMINANCE = 0.2

const HEX_COLOR = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

// Luminancia relativa de WCAG 2 de un color #RRGGBB, entre 0 y 1. Otro formato lanza: no hay
// un tono por defecto que adivinar.
export function relativeLuminance(hex: string): number {
  const match = HEX_COLOR.exec(hex)
  if (match === null) {
    throw new Error(`relativeLuminance: "${hex}" no es un color #RRGGBB.`)
  }
  const [r, g, b] = match.slice(1).map((pair) => {
    const channel = Number.parseInt(pair, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function stageToneOf(bg: string): StageTone {
  return relativeLuminance(bg) < DARK_THEME_LUMINANCE ? 'dark' : 'light'
}
