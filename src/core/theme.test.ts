import { describe, expect, it } from 'vitest'
import { getClient } from '../clients'
import { themeFromClient } from './theme'

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
