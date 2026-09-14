import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../clients'
import northline from '../clients/northline.json'
import { defaultSelection, priceRulesFromClient, validateClientConfig } from './clientConfig'
import { calculatePrice } from './pricing/calculatePrice'

function clientOrFail(slug: string) {
  const client = getClient(slug)
  if (client === null) {
    throw new Error(`cliente no encontrado en el test: ${slug}`)
  }
  return client
}

describe('getClient', () => {
  it('lista los dos clientes de la demo', () => {
    expect(listClientSlugs().sort()).toEqual(['norte', 'northline'])
  })

  it('northline devuelve una config valida', () => {
    const client = clientOrFail('northline')
    expect(client.slug).toBe('northline')
    expect(client.locale).toBe('en')
    expect(client.currency.code).toBe('USD')
    expect(client.units.area).toBe('sqft')
    expect(client.prices_placeholder).toBe(false)
  })

  it('norte devuelve una config valida', () => {
    const client = clientOrFail('norte')
    expect(client.slug).toBe('norte')
    expect(client.locale).toBe('es-AR')
    expect(client.currency.code).toBe('ARS')
    expect(client.units.area).toBe('m2')
    expect(client.prices_placeholder).toBe(true)
  })

  it('un slug desconocido devuelve null', () => {
    expect(getClient('no-existe')).toBeNull()
  })
})

describe('validateClientConfig', () => {
  it('falla si falta una clave de texts, y dice cual y en que cliente', () => {
    const broken = structuredClone(northline)
    delete (broken.texts as Partial<typeof broken.texts>).disclaimer
    expect(() => validateClientConfig(broken)).toThrow(/northline/)
    expect(() => validateClientConfig(broken)).toThrow(/disclaimer/)
  })

  it('falla si options.materials esta vacio', () => {
    const broken = structuredClone(northline)
    broken.options.materials = []
    expect(() => validateClientConfig(broken)).toThrow(/options.materials/)
  })

  it('falla si hay ids repetidos', () => {
    const broken = structuredClone(northline)
    broken.options.materials[1].id = 'pvc'
    expect(() => validateClientConfig(broken)).toThrow(/repetido/)
  })

  it('falla si el default no cae dentro del rango', () => {
    const broken = structuredClone(northline)
    broken.options.width.default = 99
    expect(() => validateClientConfig(broken)).toThrow(/fuera del rango/)
  })

  it('falla si el default no es multiplo del step', () => {
    const broken = structuredClone(northline)
    broken.options.height.default = 3.2
    expect(() => validateClientConfig(broken)).toThrow(/multiplo/)
  })

  it('falla si los descuentos no estan ordenados por minQty', () => {
    const broken = structuredClone(northline)
    broken.options.discounts = [
      { minQty: 5, pct: 10 },
      { minQty: 2, pct: 5 },
    ]
    expect(() => validateClientConfig(broken)).toThrow(/ascendente/)
  })

  it('falla si cta tiene un valor invalido', () => {
    const broken = structuredClone(northline)
    broken.cta = 'telegram'
    expect(() => validateClientConfig(broken)).toThrow(/cta/)
  })

  it('falla con un objeto vacio', () => {
    expect(() => validateClientConfig({})).toThrow(/slug/)
  })
})

describe('validateClientConfig: photos', () => {
  it('los dos clientes traen las cuatro fotos reales con ids unicos', () => {
    for (const slug of ['northline', 'norte']) {
      const photos = clientOrFail(slug).photos
      expect(photos.map((item) => item.id)).toEqual(['front-day', 'angle-left-day', 'angle-right-day', 'front-night'])
      for (const photo of photos) {
        expect(photo.src).toBe(`/assets/quote/backgrounds/${slug}-${photo.id}.webp`)
      }
    }
  })

  it('falla si falta photos, y dice en que cliente', () => {
    const broken: Record<string, unknown> = structuredClone(northline)
    delete broken.photos
    expect(() => validateClientConfig(broken)).toThrow(/northline/)
    expect(() => validateClientConfig(broken)).toThrow(/photos/)
  })

  it('falla si photos esta vacio', () => {
    const broken = structuredClone(northline)
    broken.photos = []
    expect(() => validateClientConfig(broken)).toThrow(/photos/)
  })

  it('falla si falta una clave del anchor, y dice cual', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[1].anchor as Partial<(typeof broken.photos)[number]['anchor']>).metersToWidth
    expect(() => validateClientConfig(broken)).toThrow(/photos\[1\]\.anchor\.metersToWidth/)
  })

  it('falla si x o y del anchor caen fuera de 0 a 1', () => {
    const broken = structuredClone(northline)
    broken.photos[0].anchor.y = 1.2
    expect(() => validateClientConfig(broken)).toThrow(/photos\[0\]\.anchor\.x e y/)
  })

  it('falla si metersToWidth no es mayor a 0', () => {
    const broken = structuredClone(northline)
    broken.photos[2].anchor.metersToWidth = 0
    expect(() => validateClientConfig(broken)).toThrow(/metersToWidth debe ser mayor a 0/)
  })

  it('falla si hay ids de foto repetidos', () => {
    const broken = structuredClone(northline)
    broken.photos[3].id = 'front-day'
    expect(() => validateClientConfig(broken)).toThrow(/repetido/)
  })
})

describe('priceRulesFromClient y defaultSelection', () => {
  it('las reglas salen del JSON del cliente', () => {
    const rules = priceRulesFromClient(clientOrFail('northline'))
    expect(rules.materials.map((item) => item.id)).toEqual(['pvc', 'aluminum', 'acrylic'])
    expect(rules.rangePct).toBe(8)
    expect(rules.installation).toEqual({ fixed: 350, perArea: 10 })
  })

  it('la seleccion por defecto es la primera opcion de cada lista', () => {
    const client = clientOrFail('northline')
    expect(defaultSelection(client)).toEqual({
      type: 'facade',
      text: 'NORTHLINE',
      width: 8,
      height: 3,
      materialId: 'pvc',
      lightingId: 'none',
      installation: false,
      quantity: 1,
    })
  })

  it('la seleccion por defecto de los dos clientes calcula precio sin lanzar', () => {
    for (const slug of listClientSlugs()) {
      const client = clientOrFail(slug)
      const result = calculatePrice(priceRulesFromClient(client), defaultSelection(client))
      expect(result.total).toBeGreaterThan(0)
    }
  })
})

// Las cinco claves de la hoja de cotizacion, de SPEC 1.4.
const CLAVES_DE_LA_HOJA = [
  'quoteDateLabel',
  'quoteSelectionTitle',
  'quoteBreakdownTitle',
  'quotePrint',
  'quoteBack',
] as const

describe('claves de texto de los dos clientes', () => {
  // 13.16
  it('los dos JSON tienen las mismas 42 claves, ninguna vacia', () => {
    const juegos = listClientSlugs().map((slug) => {
      const texts = clientOrFail(slug).texts
      for (const [key, value] of Object.entries(texts)) {
        expect(value.trim(), `${slug}.texts.${key}`).not.toBe('')
      }
      return Object.keys(texts).sort()
    })
    expect(juegos[0]).toHaveLength(42)
    for (const juego of juegos) {
      expect(juego).toEqual(juegos[0])
    }
  })

  // 13.17
  it('el validador rechaza una config a la que le falta cada clave nueva', () => {
    for (const key of CLAVES_DE_LA_HOJA) {
      const broken = structuredClone(northline)
      delete (broken.texts as Partial<typeof broken.texts>)[key]
      expect(() => validateClientConfig(broken)).toThrow(new RegExp(key))
      expect(() => validateClientConfig(broken)).toThrow(/northline/)
    }
  })
})
