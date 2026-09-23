import { describe, expect, it } from 'vitest'
import { STUDIO_RIG, studioSources } from './studioRig'

describe('studioSources', () => {
  it('reparte un modulo por azimut alrededor del eje vertical', () => {
    const sources = studioSources(null)
    expect(sources).toHaveLength(STUDIO_RIG.azimuthsDeg.length * STUDIO_RIG.panels.length)
    const azimuths = new Set(sources.map((s) => Math.round((Math.atan2(s.position[0], s.position[2]) * 180) / Math.PI)))
    expect([...azimuths].sort((a, b) => a - b)).toEqual([-120, -60, 0, 60, 120, 180])
  })

  it('deja todas las fuentes a la misma distancia del origen', () => {
    for (const source of studioSources(null)) {
      expect(Math.hypot(...source.position)).toBeCloseTo(STUDIO_RIG.radius)
    }
  })

  it('suma la fuente especular en la direccion de la key de la foto', () => {
    const base = studioSources(null).length
    const sources = studioSources({ azimuthDeg: -25, elevationDeg: 35 })
    expect(sources).toHaveLength(base + 1)
    const [x, y, z] = sources[base].position
    expect((Math.atan2(x, z) * 180) / Math.PI).toBeCloseTo(-25)
    expect((Math.asin(y / STUDIO_RIG.radius) * 180) / Math.PI).toBeCloseTo(35)
    expect(sources[base].intensity).toBe(STUDIO_RIG.highlight.intensity)
  })
})
