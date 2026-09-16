import { describe, expect, it } from 'vitest'
import { formatCurrency } from '../core/pricing/format'
import landing from './landing.json'
import { PRICE_SLOTS, validateLandingConfig } from './landingConfig'

function copy(): Record<string, unknown> & typeof landing {
  return structuredClone(landing)
}

describe('validateLandingConfig', () => {
  it('el JSON de la landing valida y conserva sus valores', () => {
    const config = validateLandingConfig(landing)
    expect(config.demos.map((demo) => demo.href)).toEqual(['/d/northline', '/d/norte'])
    expect([config.offer.price.setup, config.offer.price.monthly]).toEqual([250, 29])
    expect(config.offer.setup).toHaveLength(7)
    expect(config.offer.monthly).toHaveLength(7)
    expect(config.offer.more).toHaveLength(4)
    expect(config.texts.how).toHaveLength(3)
    expect(config.brand.logo).toBe('/lokebox-logo-horizontal.svg')
  })

  it('la linea de precio queda "From USD 250 setup, plus USD 29 per month."', () => {
    const config = validateLandingConfig(landing)
    const { currency, locale, offer } = config
    const price = config.texts.offerPrice
      .replace(PRICE_SLOTS.setup, formatCurrency(offer.price.setup, currency, locale))
      .replace(PRICE_SLOTS.monthly, formatCurrency(offer.price.monthly, currency, locale))
    // Intl separa el codigo del numero con un espacio duro: se lee igual que uno normal.
    expect(price.replace(/\u00a0/g, ' ')).toBe('From USD 250 setup, plus USD 29 per month.')
  })

  it('la landing no promete nada gratis ni ninguna prueba', () => {
    const visible = JSON.stringify(landing.texts) + JSON.stringify(landing.offer) + JSON.stringify(landing.demos)
    expect(visible).not.toMatch(/\bfree\b|\btrial\b/i)
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

  it('falla si el precio del setup es 0', () => {
    const broken = copy()
    broken.offer.price.setup = 0
    expect(() => validateLandingConfig(broken)).toThrow(/offer\.price\.setup/)
  })

  it('falla si una lista de la oferta queda vacia, y la nombra', () => {
    const broken = copy()
    broken.offer.monthly = []
    expect(() => validateLandingConfig(broken)).toThrow(/offer\.monthly esta vacia/)
  })

  it('falla si la linea de precio pierde uno de sus dos huecos', () => {
    const broken = copy()
    broken.texts.offerPrice = 'From {setup} setup.'
    expect(() => validateLandingConfig(broken)).toThrow(/offerPrice.*\{monthly\}/)
  })

  it('falla si brand.logo no es una ruta de public con extension', () => {
    const broken = copy()
    broken.brand.logo = 'lokebox-logo-horizontal'
    expect(() => validateLandingConfig(broken)).toThrow(/brand\.logo/)
  })

  it('falla si currency.display no es symbol ni code', () => {
    const broken = copy()
    broken.currency.display = 'codigo'
    expect(() => validateLandingConfig(broken)).toThrow(/currency\.display/)
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

  it('falla si hay dos demos con el mismo id', () => {
    const broken = copy()
    broken.demos[1].id = 'en'
    expect(() => validateLandingConfig(broken)).toThrow(/demos tiene ids repetidos/)
  })
})
