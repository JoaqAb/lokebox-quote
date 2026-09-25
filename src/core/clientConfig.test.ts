import { describe, expect, it } from 'vitest'
import { CORE_TEXT_KEYS, DEFAULT_PRICE_DISPLAY, priceDisplayOf, validateClientConfig, verticalContextOf } from './clientConfig'

// Validacion de la parte del core del JSON de cliente (SPEC 10, D133 y D135). El core no conoce
// ningun rubro ni ningun cliente: el JSON de estos tests es de una vertical inventada, con las 27
// claves del core y una clave de texto del rubro. Lo que valida carteles esta en
// src/verticals/signs/config.test.ts y lo que cruza clientes, core y vertical en src/app/clients.test.ts.

// Las 27 claves del core de SPEC 10, en el orden de la lista.
const CLAVES_DEL_CORE = [
  'headline',
  'subheadline',
  'configureTitle',
  'priceLabel',
  'priceRangeNote',
  'disclaimer',
  'ctaWhatsapp',
  'ctaForm',
  'formTitle',
  'formName',
  'formContact',
  'formNote',
  'formSubmit',
  'formSending',
  'thanksTitle',
  'thanksBody',
  'viewQuote',
  'quoteTitle',
  'quoteValidity',
  'quoteDateLabel',
  'quoteSelectionTitle',
  'quoteBreakdownTitle',
  'quotePrint',
  'quoteBack',
  'lineDiscount',
  'poweredBy',
  'loadingLabel',
]

function rawClient(): Record<string, unknown> {
  return {
    slug: 'core-test',
    locale: 'en',
    vertical: 'test',
    currency: { code: 'USD', symbol: '$', decimals: 0 },
    brand: {
      name: 'Core Test',
      logo: '/clients/core-test/logo.svg',
      colors: { bg: '#F2F1EE', primary: '#C7C2B9', accent: '#D4550A', text: '#1A1A18', muted: '#6B6A66' },
      phone: '+1 555 010 0000',
      whatsapp: '15550100000',
      email: 'hello@core-test.example',
    },
    cta: 'both',
    poweredBy: true,
    prices_placeholder: false,
    // Una clave del rubro: el core no la valida y la deja pasar al texts del cliente.
    texts: { ...Object.fromEntries(CLAVES_DEL_CORE.map((key) => [key, `texto ${key}`])), widgetLabel: 'Widget' },
  }
}

function withTexts(mutate: (texts: Record<string, unknown>) => void): Record<string, unknown> {
  const raw = rawClient()
  const texts = { ...(raw.texts as Record<string, unknown>) }
  mutate(texts)
  raw.texts = texts
  return raw
}

describe('validateClientConfig', () => {
  it('una config del core valida pasa y guarda el JSON tal cual para la vertical', () => {
    const raw = rawClient()
    const config = validateClientConfig(raw)
    expect(config.slug).toBe('core-test')
    expect(config.vertical).toBe('test')
    expect(config.currency).toEqual({ code: 'USD', symbol: '$', decimals: 0 })
    expect(config.json).toBe(raw)
    expect(Object.keys(config).sort()).toEqual(
      ['brand', 'cta', 'currency', 'json', 'locale', 'poweredBy', 'prices_placeholder', 'slug', 'texts', 'vertical'].sort(),
    )
  })

  // Movido de 2.12 con el mismo caso, sobre el JSON de este test.
  it('falla si falta una clave de texts, y dice cual y en que cliente', () => {
    const broken = withTexts((texts) => {
      delete texts.disclaimer
    })
    expect(() => validateClientConfig(broken)).toThrow(/core-test/)
    expect(() => validateClientConfig(broken)).toThrow(/disclaimer/)
  })

  it('falla si cta tiene un valor invalido', () => {
    const broken = rawClient()
    broken.cta = 'telegram'
    expect(() => validateClientConfig(broken)).toThrow(/cta/)
  })

  it('falla con un objeto vacio', () => {
    expect(() => validateClientConfig({})).toThrow(/slug/)
  })

  // D132: el tono del escenario sale de brand.colors.bg, que tiene que ser #RRGGBB.
  it('falla si brand.colors.bg no es #RRGGBB, nombrando el valor y el cliente', () => {
    for (const value of ['#FFF', 'white', 'rgb(1, 2, 3)']) {
      const broken = rawClient() as { brand: { colors: Record<string, string> } }
      broken.brand.colors.bg = value
      expect(() => validateClientConfig(broken), value).toThrow(`Cliente "core-test": brand.colors.bg "${value}" no es un color #RRGGBB.`)
    }
  })

  // Movido de 2.12: la parte de la clave requerida. Los dos idiomas estan en src/app/clients.test.ts.
  it('loadingLabel es requerida', () => {
    const broken = withTexts((texts) => {
      delete texts.loadingLabel
    })
    expect(() => validateClientConfig(broken)).toThrow(/loadingLabel/)
  })
})

describe('claves de texto del core', () => {
  // 13.16, parte del core (hasta 2.12 era el test de las 47 claves).
  it('el core valida las 27 claves de SPEC 10, y el texts deja pasar las demas del JSON', () => {
    expect(CORE_TEXT_KEYS).toEqual(CLAVES_DEL_CORE)
    const texts = validateClientConfig(rawClient()).texts
    expect(Object.keys(texts).sort()).toEqual([...CLAVES_DEL_CORE, 'widgetLabel'].sort())
    expect(texts.widgetLabel).toBe('Widget')
    for (const key of CLAVES_DEL_CORE) {
      expect((texts as Record<string, string>)[key]).toBe(`texto ${key}`)
    }
  })

  // 13.17, parte del core: cada una de las 27, que incluyen las cinco de la hoja de SPEC 1.4.
  it('el validador rechaza una config a la que le falta cada una de las 27 claves, o la trae vacia', () => {
    for (const key of CLAVES_DEL_CORE) {
      const missing = withTexts((texts) => {
        delete texts[key]
      })
      expect(() => validateClientConfig(missing), key).toThrow(`Cliente "core-test": falta la clave de texto "${key}" o no es un string no vacio.`)
      const empty = withTexts((texts) => {
        texts[key] = ''
      })
      expect(() => validateClientConfig(empty), key).toThrow(`"${key}"`)
    }
  })

  it('una clave que no es del core no se valida en el core: la valida su vertical', () => {
    const raw = withTexts((texts) => {
      texts.widgetLabel = 7
    })
    expect(validateClientConfig(raw).texts.widgetLabel).toBeUndefined()
  })
})

describe('validateClientConfig: pricing.display', () => {
  // Un JSON con el objeto pricing.
  function withDisplay(display: unknown) {
    const raw = rawClient()
    raw.pricing = { display }
    return raw
  }

  it('el default es range', () => {
    expect(DEFAULT_PRICE_DISPLAY).toBe('range')
  })

  it('sin el objeto, o con el objeto y sin display, vale range', () => {
    const raw = rawClient()
    expect(priceDisplayOf(validateClientConfig(raw))).toBe('range')
    raw.pricing = {}
    expect(priceDisplayOf(validateClientConfig(raw))).toBe('range')
  })

  it('exact, range y hidden pasan y quedan en el config', () => {
    for (const display of ['exact', 'range', 'hidden'] as const) {
      const config = validateClientConfig(withDisplay(display))
      expect(config.pricing).toEqual({ display })
      expect(priceDisplayOf(config)).toBe(display)
    }
  })

  // No caen a range: un fallback silencioso mostraria precio a un cliente que pidio
  // no mostrarlo. La etapa 1 de D30 los rechaza al cargar.
  it('gated e internal fallan nombrando el valor y diciendo que faltan', () => {
    for (const display of ['gated', 'internal'] as const) {
      expect(() => validateClientConfig(withDisplay(display))).toThrow(
        new RegExp(`"${display}".*no esta implementado`),
      )
    }
  })

  it('un valor desconocido falla nombrandolo', () => {
    expect(() => validateClientConfig(withDisplay('secreto'))).toThrow(/"secreto".*no es un modo valido/)
    expect(() => validateClientConfig(withDisplay(7))).toThrow(/pricing\.display/)
  })
})

describe('verticalContextOf', () => {
  it('lleva a la vertical el slug, el locale, la moneda, el cta y el modo ya resueltos', () => {
    const raw = rawClient()
    raw.pricing = { display: 'hidden' }
    raw.cta = 'form'
    expect(verticalContextOf(validateClientConfig(raw))).toEqual({
      slug: 'core-test',
      locale: 'en',
      currency: { code: 'USD', symbol: '$', decimals: 0 },
      cta: 'form',
      display: 'hidden',
    })
    expect(verticalContextOf(validateClientConfig(rawClient())).display).toBe('range')
  })
})
