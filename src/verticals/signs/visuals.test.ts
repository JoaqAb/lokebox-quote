import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../../clients'
import { defaultSelection } from '../../core/clientConfig'
import type { SignSelection } from '../../core/types'
import northline from '../../clients/northline.json'
import { lengthToMeters, resolveSignVisual } from './visuals'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

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
  it('para los tres materiales de los dos clientes devuelve exactamente el visual del JSON', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const material of config.options.materials) {
        const selection: SignSelection = { ...defaultSelection(config), materialId: material.id }
        expect(resolveSignVisual(config, selection).material).toEqual(material.visual)
      }
    }
  })

  // 12.3
  it('para los tres modos de luz de los dos clientes devuelve none, front y back', () => {
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      const modes = config.options.lighting.map((lighting) => {
        const selection: SignSelection = { ...defaultSelection(config), lightingId: lighting.id }
        return resolveSignVisual(config, selection).lighting.mode
      })
      expect(modes).toEqual(['none', 'front', 'back'])
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

describe('lengthToMeters', () => {
  // 12.5
  it('convierte ft y m, y lanza con cualquier otra unidad', () => {
    expect(lengthToMeters('ft')).toBe(0.3048)
    expect(lengthToMeters('m')).toBe(1)
    expect(() => lengthToMeters('in')).toThrow(/in/)
    expect(() => lengthToMeters('')).toThrow()
  })
})
