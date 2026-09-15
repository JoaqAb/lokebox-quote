import { describe, expect, it } from 'vitest'
import { BORDER_MIX_PCT, SURFACE_MIX_PCT, mix } from '../core/theme'
import landing from './landing.json'
import { validateLandingConfig } from './landingConfig'
import { themeFromLanding } from './landingTheme'

describe('themeFromLanding', () => {
  it('emite exactamente las seis variables que usan las clases de la landing', () => {
    const config = validateLandingConfig(landing)
    const theme = themeFromLanding(config)
    expect(Object.keys(theme).sort()).toEqual(
      ['--q-accent', '--q-bg', '--q-border', '--q-muted', '--q-surface', '--q-text'].sort(),
    )
    expect(theme['--q-bg']).toBe(config.colors.bg)
    expect(theme['--q-accent']).toBe(config.colors.accent)
  })

  it('superficie y borde son la misma mezcla que el tema de cliente', () => {
    const theme = themeFromLanding(validateLandingConfig(landing))
    expect(theme['--q-surface']).toBe(mix(SURFACE_MIX_PCT))
    expect(theme['--q-border']).toBe(mix(BORDER_MIX_PCT))
  })
})
