import { describe, expect, it } from 'vitest'
import landing from './landing.json'
import { validateLandingConfig } from './landingConfig'

function copy(): Record<string, unknown> & typeof landing {
  return structuredClone(landing)
}

describe('validateLandingConfig', () => {
  it('el JSON de la landing valida y conserva sus valores', () => {
    const config = validateLandingConfig(landing)
    expect(config.demos.map((demo) => demo.href)).toEqual(['/d/northline', '/d/norte'])
    expect(config.tiers.map((tier) => [tier.setup, tier.monthly])).toEqual([
      [750, 79],
      [1500, 149],
    ])
    expect(config.texts.how).toHaveLength(3)
  })

  it('falla si falta una clave de texts, y la nombra', () => {
    const broken = copy()
    delete (broken.texts as Partial<typeof landing.texts>).contactButton
    expect(() => validateLandingConfig(broken)).toThrow(/^Landing: .*texts\.contactButton/)
  })

  it('falla si un color no es hexadecimal de seis digitos', () => {
    const broken = copy()
    broken.colors.accent = 'blue'
    expect(() => validateLandingConfig(broken)).toThrow(/colors\.accent/)
  })

  it('falla si una demo apunta a un slug que no es cliente, y nombra href y slug', () => {
    const broken = copy()
    broken.demos[1].href = '/d/sur'
    expect(() => validateLandingConfig(broken)).toThrow(/"\/d\/sur".*"sur"/)
  })

  it('falla si un tier tiene setup en 0', () => {
    const broken = copy()
    broken.tiers[0].setup = 0
    expect(() => validateLandingConfig(broken)).toThrow(/tiers\[0\]\.setup/)
  })

  it('falla si el email no tiene arroba', () => {
    const broken = copy()
    broken.contact.email = 'hello.lokebox.com'
    expect(() => validateLandingConfig(broken)).toThrow(/contact\.email/)
  })

  it('falla si how no tiene tres pasos', () => {
    const broken = copy()
    broken.texts.how = broken.texts.how.slice(0, 2)
    expect(() => validateLandingConfig(broken)).toThrow(/texts\.how/)
  })

  it('falla si hay dos tiers con el mismo id', () => {
    const broken = copy()
    broken.tiers[1].id = 'starter'
    expect(() => validateLandingConfig(broken)).toThrow(/tiers tiene ids repetidos/)
  })
})
