import { describe, expect, it } from 'vitest'
import { listClientSlugs } from '../../clients'
import { defaultSelection, materialsForMode } from './config'
import type { SignSelection } from './types'
import northline from '../../clients/northline.json'
import { lengthToMeters, resolveSignVisual } from './visuals'
import { signsClientOf } from './testing'

const clientOrFail = signsClientOf

describe('resolveSignVisual', () => {
  // 12.1
  it('con la seleccion default de northline devuelve el visual de pvc y luz none', () => {
    const config = clientOrFail('northline')
    const visual = resolveSignVisual(config, defaultSelection(config))
    expect(visual.material).toEqual(northline.options.materials[0].visual)
    expect(visual.lighting.mode).toBe('none')
    expect(visual.lengthToMeters).toBe(0.3048)
  })

  // 12.2
  it('para cada material de cada cliente devuelve exactamente el visual del JSON', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const material of config.options.materials) {
        const selection: SignSelection = { ...defaultSelection(config), materialId: material.id }
        expect(resolveSignVisual(config, selection).material).toEqual(material.visual)
      }
    }
  })

  // 12.3
  // D127: cada cliente devuelve los modos de su JSON, en su orden; los dos de la demo, por slug,
  // siguen ofreciendo exactamente none, front y back.
  it('para cada luz de cada cliente devuelve el modo de su JSON, y none, front y back en la demo', () => {
    const modesOf = (slug: string) => {
      const config = clientOrFail(slug)
      return config.options.lighting.map((lighting) => {
        const selection: SignSelection = { ...defaultSelection(config), lightingId: lighting.id }
        return resolveSignVisual(config, selection).lighting.mode
      })
    }
    for (const slug of listClientSlugs()) {
      expect(modesOf(slug), slug).toEqual(clientOrFail(slug).options.lighting.map((lighting) => lighting.visual.mode))
    }
    for (const slug of ['northline', 'norte']) {
      expect(modesOf(slug), slug).toEqual(['none', 'front', 'back'])
    }
  })

  // 12.4
  it('lanza con un material o una iluminacion que no existen, con el id en el mensaje', () => {
    const config = clientOrFail('northline')
    const base = defaultSelection(config)
    expect(() => resolveSignVisual(config, { ...base, materialId: 'madera' })).toThrow(/madera/)
    expect(() => resolveSignVisual(config, { ...base, lightingId: 'neon' })).toThrow(/neon/)
  })
})

describe('resolveSignVisual: mount', () => {
  // Version 2.4, D68: el montaje sale del tipo, y letters no monta un panel.
  // D127: cada tipo de cada cliente monta como dice su JSON y letters no monta; los dos de la demo,
  // por slug, siguen con facade standoff, totem al ras y letters sin montaje. Cada caso (standoff,
  // flush y sin montaje) aparece en al menos un cliente.
  it('cada tipo monta segun su JSON, y facade con standoff, totem al ras y letters sin montaje en la demo', () => {
    const vistos = new Set<string>()
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const type of config.options.types) {
        const selection = {
          ...defaultSelection(config),
          type: type.id,
          materialId: materialsForMode(config.options, type.pricing)[0].id,
        }
        const expected = type.pricing === 'letters' ? null : (type.visual?.mount ?? null)
        expect(resolveSignVisual(config, selection).mount, `${slug} ${type.id}`).toBe(expected)
        vistos.add(String(expected))
      }
    }
    expect([...vistos].sort()).toEqual(['flush', 'null', 'standoff'])
    for (const slug of ['northline', 'norte']) {
      const config = clientOrFail(slug)
      const mountOf = (type: string) => resolveSignVisual(config, { ...defaultSelection(config), type }).mount
      expect([mountOf('facade'), mountOf('totem'), mountOf('letters')], slug).toEqual(['standoff', 'flush', null])
    }
  })
})

describe('lengthToMeters', () => {
  // 12.5
  it('convierte ft y m, y lanza con cualquier otra unidad', () => {
    expect(lengthToMeters('ft')).toBe(0.3048)
    expect(lengthToMeters('m')).toBe(1)
    expect(() => lengthToMeters('in')).toThrow(/in/)
    expect(() => lengthToMeters('')).toThrow()
  })
})

describe('resolveSignVisual en modo letters', () => {
  it('trae el modo del tipo y la profundidad en metros de la opcion elegida', () => {
    const config = clientOrFail('northline')
    const area = resolveSignVisual(config, defaultSelection(config))
    expect(area.mode).toBe('area')
    const letters = resolveSignVisual(config, { ...defaultSelection(config), type: 'letters', depthId: 'd6' })
    expect(letters.mode).toBe('letters')
    expect(letters.depthMeters).toBe(0.1524)
  })
})
