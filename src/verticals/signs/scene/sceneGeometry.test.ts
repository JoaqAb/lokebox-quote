import { Color } from 'three'
import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../../clients'
import { defaultSelection } from '../../../core/clientConfig'
import { themeFromClient } from '../../../core/theme'
import type { SignSelection } from '../../../core/types'
import { lengthToMeters } from '../visuals'
import { SET, WINDOW_TOP, scenePalette, signBoxMeters } from './sceneGeometry'
import { hasWebGL } from './webgl'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

// Los cuatro extremos de ancho y alto de un cliente.
function extremeSelections(slug: string): SignSelection[] {
  const config = clientOrFail(slug)
  const base = defaultSelection(config)
  const { width, height } = config.options
  return [
    { ...base, width: width.min, height: height.min },
    { ...base, width: width.min, height: height.max },
    { ...base, width: width.max, height: height.min },
    { ...base, width: width.max, height: height.max },
  ]
}

function luminance(hex: string): number {
  const color = new Color(hex)
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

describe('signBoxMeters', () => {
  // 12.6
  it('convierte a metros segun la unidad del cliente', () => {
    const northline = clientOrFail('northline')
    const en = signBoxMeters(
      { ...defaultSelection(northline), width: 8, height: 3 },
      lengthToMeters('ft'),
    )
    expect(en.width).toBeCloseTo(2.4384, 6)
    expect(en.height).toBeCloseTo(0.9144, 6)

    const norte = clientOrFail('norte')
    const es = signBoxMeters(
      { ...defaultSelection(norte), width: 2.5, height: 1 },
      lengthToMeters('m'),
    )
    expect(es.width).toBe(2.5)
    expect(es.height).toBe(1)
  })

  // 12.7
  it('en los cuatro extremos de los dos clientes el cartel entra en la fachada', () => {
    for (const slug of listClientSlugs()) {
      const factor = lengthToMeters(clientOrFail(slug).units.length)
      for (const selection of extremeSelections(slug)) {
        const box = signBoxMeters(selection, factor)
        expect(box.width / 2).toBeLessThanOrEqual(SET.facade.width / 2 - 0.3)
        expect(box.centerY + box.height / 2).toBeLessThanOrEqual(SET.facade.height - 0.2)
      }
    }
  })

  // 12.8
  it('en los mismos casos el cartel queda por encima de la vidriera', () => {
    for (const slug of listClientSlugs()) {
      const factor = lengthToMeters(clientOrFail(slug).units.length)
      for (const selection of extremeSelections(slug)) {
        const box = signBoxMeters(selection, factor)
        expect(box.centerY - box.height / 2).toBeGreaterThanOrEqual(WINDOW_TOP + 0.2)
      }
    }
  })
})

describe('scenePalette', () => {
  // 12.9
  it('deriva del tema: la fachada es el primary y la vereda es mas oscura', () => {
    for (const slug of listClientSlugs()) {
      const theme = themeFromClient(clientOrFail(slug))
      const palette = scenePalette(theme)
      expect(palette.facade.toLowerCase()).toBe(theme['--q-primary'].toLowerCase())
      expect(palette.doorFrame.toLowerCase()).toBe(theme['--q-bg'].toLowerCase())
      expect(palette.glass.toLowerCase()).toBe(theme['--q-accent'].toLowerCase())
      expect(luminance(palette.sidewalk)).toBeLessThan(luminance(palette.facade))
    }
  })

  it('lanza si falta una variable del tema', () => {
    expect(() => scenePalette({ '--q-primary': '#101317' })).toThrow(/--q-bg/)
  })
})

describe('hasWebGL', () => {
  // 12.10
  it('devuelve false en entorno node y no lanza', () => {
    expect(hasWebGL()).toBe(false)
  })
})
