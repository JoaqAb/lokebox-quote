import { BORDER_MIX_PCT, SURFACE_MIX_PCT, mix } from '../core/theme'
import type { LandingConfig } from './landingConfig'

// Tema de la landing como variables CSS (SPEC 13). Reusa los tokens --q- del cotizador para
// que .q-control, .q-on, .q-off, .q-hairline y .q-panel sirvan igual. Superficie y borde se
// derivan con la misma mezcla y los mismos porcentajes que el tema de cliente. No emite
// --q-primary ni --q-stage: ninguna clase que usa la landing los consume.

export function themeFromLanding(landing: LandingConfig): Record<string, string> {
  const { colors } = landing
  return {
    '--q-bg': colors.bg,
    '--q-text': colors.text,
    '--q-muted': colors.muted,
    '--q-accent': colors.accent,
    '--q-surface': mix(SURFACE_MIX_PCT),
    '--q-border': mix(BORDER_MIX_PCT),
  }
}
