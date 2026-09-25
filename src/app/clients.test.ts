import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../clients'
import { CORE_TEXT_KEYS, DEFAULT_PRICE_DISPLAY, priceDisplayOf } from '../core/clientConfig'
import { stageToneOf, themeFromClient } from '../core/theme'
import { resolveClient } from '../pages/resolveClient'
import { HIDDEN_TEMPLATE_KEYS, SIGN_TEXT_KEYS } from '../verticals/signs/config'
import { BOX_HIDDEN_TEMPLATE_KEY, BOX_TEXT_KEYS } from '../verticals/boxes/config'
import { signsClientSlugs, signsConfigOf } from '../verticals/signs/testing'
import { BOXES_VERTICAL, SIGNS_VERTICAL, verticalOf } from './verticals'

// Tests que cruzan las tres capas: los JSON de src/clients, la validacion del core y el registro
// de verticales. Hasta la version 2.12 estaban en src/core/clientConfig.test.ts y en
// src/core/theme.test.ts; desde 2.13 el core no importa de src/clients (SPEC 4.4).

// Los clientes de una vertical (D148): exige al menos uno.
function slugsOf(vertical: string): string[] {
  const slugs = listClientSlugs().filter((slug) => clientOrFail(slug).vertical === vertical)
  expect(slugs.length, vertical).toBeGreaterThan(0)
  return slugs
}

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('getClient', () => {
  // D127: el registro lista exactamente los JSON de src/clients/, y entre ellos los dos de la demo.
  it('lista todos los JSON de src/clients/, con los dos clientes de la demo', () => {
    // Listado de archivos de Vite, sin cargar los modulos: lo que hay en la carpeta.
    const files = Object.keys(import.meta.glob('../clients/*.json'))
      .map((path) => path.slice(path.lastIndexOf('/') + 1, -'.json'.length))
      .sort()
    expect(listClientSlugs()).toEqual(files)
    expect(listClientSlugs()).toContain('northline')
    expect(listClientSlugs()).toContain('norte')
  })

  it('northline devuelve una config valida', () => {
    const client = clientOrFail('northline')
    expect(client.slug).toBe('northline')
    expect(client.locale).toBe('en')
    expect(client.currency.code).toBe('USD')
    // units es de la vertical desde 2.13 (D136).
    expect(signsConfigOf('northline').units.area).toBe('sqft')
    expect(client.prices_placeholder).toBe(false)
  })

  it('norte devuelve una config valida', () => {
    const client = clientOrFail('norte')
    expect(client.slug).toBe('norte')
    expect(client.locale).toBe('es-AR')
    expect(client.currency.code).toBe('ARS')
    expect(signsConfigOf('norte').units.area).toBe('m2')
    expect(client.prices_placeholder).toBe(true)
  })

  it('un slug desconocido devuelve null', () => {
    expect(getClient('no-existe')).toBeNull()
  })
})

describe('pricing.display en los clientes de la demo', () => {
  // D127: es propio de la demo, se fija por slug. Movido de src/core/clientConfig.test.ts.
  it('los dos clientes de la demo no traen pricing y sirven range', () => {
    for (const slug of ['northline', 'norte']) {
      const config = clientOrFail(slug)
      expect(config.pricing).toBeUndefined()
      expect(priceDisplayOf(config)).toBe('range')
    }
    expect(DEFAULT_PRICE_DISPLAY).toBe('range')
  })

  // Movido de src/core/clientConfig.test.ts: la parte de los dos idiomas.
  it('loadingLabel sale del JSON en los dos idiomas', () => {
    expect(clientOrFail('northline').texts.loadingLabel).toBe('Preparing your sign')
    expect(clientOrFail('norte').texts.loadingLabel).toBe('Preparando tu cartel')
  })
})

describe('las 47 claves de texts', () => {
  // 13.16: las 27 del core y las 20 de carteles no se pisan y suman las 47 de cada JSON, mas las dos
  // de hidden solo donde corresponden (D135). El JSON sigue con un solo objeto texts.
  it('las 27 del core y las 20 de carteles son disjuntas y cubren las claves de cada JSON', () => {
    const core: readonly string[] = CORE_TEXT_KEYS
    const signs: readonly string[] = SIGN_TEXT_KEYS
    expect(core).toHaveLength(27)
    expect(signs).toHaveLength(20)
    expect(core.filter((key) => signs.includes(key))).toEqual([])
    const all = [...core, ...signs].sort()
    // Editada en TAREA_033 (D148): recorre los clientes de carteles; los de cajas, en el test de abajo.
    for (const slug of signsClientSlugs()) {
      const config = clientOrFail(slug)
      const keys = Object.keys(config.texts).filter((key) => !(HIDDEN_TEMPLATE_KEYS as readonly string[]).includes(key))
      expect(keys.sort(), slug).toEqual(all)
    }
  })
})

describe('themeFromClient sobre los clientes', () => {
  // Movido de src/core/theme.test.ts.
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


describe('las 44 claves de texts de cajas', () => {
  it('las 27 del core y las 17 de cajas son disjuntas y cubren las claves de cada JSON de cajas', () => {
    const core: readonly string[] = CORE_TEXT_KEYS
    const boxes: readonly string[] = BOX_TEXT_KEYS
    expect(boxes).toHaveLength(17)
    expect(core.filter((key) => boxes.includes(key))).toEqual([])
    const all = [...core, ...boxes].sort()
    for (const slug of slugsOf(BOXES_VERTICAL)) {
      const keys = Object.keys(clientOrFail(slug).texts).filter((key) => key !== BOX_HIDDEN_TEMPLATE_KEY)
      expect(keys.sort(), slug).toEqual(all)
    }
  })
})

describe('stageToneOf sobre los clientes', () => {
  // Movido de src/core/theme.test.ts.
  it('en los clientes del registro solo afterglow tiene tema oscuro', () => {
    const slugs = listClientSlugs()
    // Editada en TAREA_033: suma cajasur y foldline, los dos clientes de cajas, con tema claro.
    expect(slugs).toEqual(['afterglow', 'alba', 'cajasur', 'foldline', 'halcyon', 'norte', 'northline'])
    const dark = slugs.filter((slug) => stageToneOf(clientOrFail(slug).brand.colors.bg) === 'dark')
    expect(dark).toEqual(['afterglow'])
  })
})

describe('registro de verticales y resolveClient', () => {
  // Editada en TAREA_033 (D148): cada cliente resuelve a la vertical de su JSON, los cinco de
  // carteles a carteles y los dos de cajas a cajas.
  it('cada cliente resuelve a la vertical de su JSON: cinco de carteles y dos de cajas', () => {
    expect(slugsOf(SIGNS_VERTICAL)).toEqual(['afterglow', 'alba', 'halcyon', 'norte', 'northline'])
    expect(slugsOf(BOXES_VERTICAL)).toEqual(['cajasur', 'foldline'])
    for (const vertical of [SIGNS_VERTICAL, BOXES_VERTICAL]) {
      for (const slug of slugsOf(vertical)) {
        const resolved = resolveClient(slug)
        expect(resolved.ok, slug).toBe(true)
        if (resolved.ok) {
          expect(resolved.config.vertical).toBe(vertical)
          expect(resolved.vertical).toBe(verticalOf(vertical))
        }
      }
    }
  })

  it('una vertical que no esta en el registro es null, y un slug desconocido da la ruta', () => {
    // Editada en TAREA_033: boxes ya esta en el registro; una vertical que no esta es muebles.
    expect(verticalOf('furniture')).toBeNull()
    expect(verticalOf('constructor')).toBeNull()
    expect(resolveClient('no-existe')).toEqual({ ok: false, detail: '/d/no-existe' })
  })

  it('resuelve cada cliente una sola vez', () => {
    const first = resolveClient('northline')
    const second = resolveClient('northline')
    expect(first.ok && second.ok && first.verticalConfig === second.verticalConfig).toBe(true)
  })
})
