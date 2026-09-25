import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../clients'
import { DARK_THEME_LUMINANCE, relativeLuminance, stageToneOf, themeFromClient } from './theme'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('themeFromClient', () => {
  // 12.8 (editada en TAREA_009: compara contra el JSON en vez de contra hexadecimales
  // pinchados, que es lo que la prueba siempre quiso decir, y suma las dos derivadas.)
  it('espeja los cinco colores del JSON, para los dos clientes', () => {
    for (const slug of ['northline', 'norte']) {
      const config = clientOrFail(slug)
      const theme = themeFromClient(config)
      expect(theme['--q-bg'], slug).toBe(config.brand.colors.bg)
      expect(theme['--q-primary'], slug).toBe(config.brand.colors.primary)
      expect(theme['--q-accent'], slug).toBe(config.brand.colors.accent)
      expect(theme['--q-text'], slug).toBe(config.brand.colors.text)
      expect(theme['--q-muted'], slug).toBe(config.brand.colors.muted)
    }
  })

  // 9.1
  it('deriva superficie y borde con color-mix sobre el texto y el fondo', () => {
    const theme = themeFromClient(clientOrFail('northline'))
    for (const key of ['--q-surface', '--q-border']) {
      expect(theme[key]).toMatch(/^color-mix\(in srgb, var\(--q-text\) \d+%, var\(--q-bg\)\)$/)
    }
    // El borde entra mas que la superficie: si no, no se distinguen entre si.
    const pct = (v: string): number => Number(/(\d+)%/.exec(v)?.[1])
    expect(pct(theme['--q-border'])).toBeGreaterThan(pct(theme['--q-surface']))
  })

  it('deriva el escenario del modo cartel con color-mix sobre el texto y el fondo, en los dos clientes', () => {
    for (const slug of ['northline', 'norte']) {
      const theme = themeFromClient(clientOrFail(slug))
      expect(theme['--q-stage'], slug).toBe('color-mix(in srgb, var(--q-text) 82%, var(--q-bg))')
    }
  })

  it('superficie y borde no cambian con el escenario: siguen en 6 y 16', () => {
    const theme = themeFromClient(clientOrFail('northline'))
    expect(theme['--q-surface']).toBe('color-mix(in srgb, var(--q-text) 6%, var(--q-bg))')
    expect(theme['--q-border']).toBe('color-mix(in srgb, var(--q-text) 16%, var(--q-bg))')
  })

  // 9.1
  it('ninguna variable del tema lleva un hexadecimal escrito en el codigo', () => {
    const theme = themeFromClient(clientOrFail('norte'))
    const delJson = Object.values(clientOrFail('norte').brand.colors)
    for (const value of Object.values(theme)) {
      if (value.startsWith('#')) {
        expect(delJson).toContain(value)
      }
    }
  })
})

// D132: el tono del escenario sale de la luminancia relativa del fondo del tema.
describe('relativeLuminance y stageToneOf', () => {
  it('da los extremos de WCAG en negro y blanco, y el gris medio de sRGB', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 10)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10)
    // 0x80 = 128: (128/255 + 0.055) / 1.055, a la 2.4.
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2158605, 6)
  })

  it('pesa cada canal con los coeficientes de WCAG', () => {
    expect(relativeLuminance('#FF0000')).toBeCloseTo(0.2126, 10)
    expect(relativeLuminance('#00FF00')).toBeCloseTo(0.7152, 10)
    expect(relativeLuminance('#0000FF')).toBeCloseTo(0.0722, 10)
  })

  it('lanza con un color que no es #RRGGBB, nombrandolo', () => {
    for (const value of ['#FFF', 'FFFFFF', 'rgb(0, 0, 0)', '#GGGGGG', '']) {
      expect(() => relativeLuminance(value), value).toThrow(`"${value}"`)
    }
  })

  it('es oscuro por debajo de 0,2 y claro desde 0,2', () => {
    expect(DARK_THEME_LUMINANCE).toBe(0.2)
    // #7C7C7C da 0,2016 y #7B7B7B da 0,1981.
    expect(stageToneOf('#7C7C7C')).toBe('light')
    expect(stageToneOf('#7B7B7B')).toBe('dark')
    expect(stageToneOf('#000000')).toBe('dark')
    expect(stageToneOf('#FFFFFF')).toBe('light')
  })

  it('en los clientes del registro solo afterglow tiene tema oscuro', () => {
    const slugs = listClientSlugs()
    expect(slugs).toEqual(['afterglow', 'alba', 'halcyon', 'norte', 'northline'])
    const dark = slugs.filter((slug) => stageToneOf(clientOrFail(slug).brand.colors.bg) === 'dark')
    expect(dark).toEqual(['afterglow'])
  })
})
