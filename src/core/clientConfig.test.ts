import { describe, expect, it } from 'vitest'
import { getClient, listClientSlugs } from '../clients'
import northline from '../clients/northline.json'
import {
  DEFAULT_PRICE_DISPLAY,
  defaultSelection,
  materialsForMode,
  priceDisplayOf,
  priceRulesFromClient,
  pricingModeOf,
  validateClientConfig,
} from './clientConfig'
import { calculatePrice } from './pricing/calculatePrice'

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

  // Version 2.4, D68.
  it('mount es obligatorio en los tipos de area, flush o standoff, y letters no lo lleva', () => {
    const config = validateClientConfig(structuredClone(northline))
    const mounts = Object.fromEntries(config.options.types.map((item) => [item.id, item.visual?.mount]))
    expect(mounts).toEqual({ facade: 'standoff', totem: 'flush', letters: undefined })
    const missing = structuredClone(northline) as unknown as { options: { types: { visual?: unknown }[] } }
    delete missing.options.types[0].visual
    expect(() => validateClientConfig(missing)).toThrow(/"facade".*visual.mount/)
    const wrong = structuredClone(northline) as unknown as { options: { types: { visual: { mount: string } }[] } }
    wrong.options.types[1].visual.mount = 'glued'
    expect(() => validateClientConfig(wrong)).toThrow(/"totem".*"glued"/)
  })

  it('falla si options.materials esta vacio', () => {
    const broken = structuredClone(northline)
    broken.options.materials = []
    expect(() => validateClientConfig(broken)).toThrow(/options.materials/)
  })

  it('falla si un material trae un finish que no existe, nombrandolo', () => {
    const broken = structuredClone(northline) as unknown as { options: { materials: { visual: { finish: string } }[] } }
    broken.options.materials[0].visual.finish = 'glossy'
    expect(() => validateClientConfig(broken)).toThrow(/options.materials\[0\].visual.finish "glossy"/)
  })

  it('falla si falta un parametro fisico o sale de 0 a 1', () => {
    const missing = structuredClone(northline)
    delete (missing.options.materials[2].visual as Partial<(typeof missing.options.materials)[number]['visual']>).clearcoat
    expect(() => validateClientConfig(missing)).toThrow(/options.materials\[2\].visual.clearcoat/)
    const outside = structuredClone(northline)
    outside.options.materials[1].visual.anisotropy = 1.5
    expect(() => validateClientConfig(outside)).toThrow(/visual.anisotropy vale 1.5/)
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

  // D132: el tono del escenario sale de brand.colors.bg, que tiene que ser #RRGGBB.
  it('falla si brand.colors.bg no es #RRGGBB, nombrando el valor y el cliente', () => {
    for (const value of ['#FFF', 'white', 'rgb(1, 2, 3)']) {
      const broken = structuredClone(northline)
      broken.brand.colors.bg = value
      expect(() => validateClientConfig(broken), value).toThrow(`Cliente "northline": brand.colors.bg "${value}" no es un color #RRGGBB.`)
    }
  })
})

describe('validateClientConfig: photos', () => {
  it('los dos clientes traen las dos fotos frontales con ids unicos', () => {
    for (const slug of ['northline', 'norte']) {
      const photos = clientOrFail(slug).photos
      expect(photos.map((item) => item.id)).toEqual(['front-day', 'front-night'])
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
    broken.photos[1].anchor.metersToWidth = 0
    expect(() => validateClientConfig(broken)).toThrow(/metersToWidth debe ser mayor a 0/)
  })

  it('falla si hay ids de foto repetidos', () => {
    const broken = structuredClone(northline)
    broken.photos[1].id = 'front-day'
    expect(() => validateClientConfig(broken)).toThrow(/repetido/)
  })
})

describe('validateClientConfig: anchorGround', () => {
  // Version 2.7 (D85): wallY es de cada foto, porque la linea de fachada cae distinto en cada una.
  it('las dos fotos de los dos clientes traen anchorGround, compartido entre Front y Night salvo wallY', () => {
    for (const slug of ['northline', 'norte']) {
      const [day, night] = clientOrFail(slug).photos
      expect(day.anchorGround).toBeDefined()
      expect({ ...night.anchorGround, wallY: 0 }).toEqual({ ...day.anchorGround, wallY: 0 })
      // El totem esta mas cerca de la camara que la fachada.
      expect(day.anchorGround?.metersToWidth).toBeGreaterThan(day.anchor.metersToWidth)
    }
  })

  it('wallY es obligatorio, entre 0 y 1 y por encima del apoyo', () => {
    for (const slug of ['northline', 'norte']) {
      for (const photo of clientOrFail(slug).photos) {
        const ground = photo.anchorGround
        expect(ground?.wallY).toBeGreaterThan(0)
        expect(ground?.wallY).toBeLessThan(ground?.y ?? 0)
      }
    }
    const missing = structuredClone(northline) as unknown as { photos: { anchorGround: { wallY?: number } }[] }
    delete missing.photos[0].anchorGround.wallY
    expect(() => validateClientConfig(missing)).toThrow(/anchorGround.wallY/)
    const below = structuredClone(northline)
    below.photos[1].anchorGround.wallY = 0.95
    expect(() => validateClientConfig(below)).toThrow(/photos\[1\].anchorGround.wallY/)
    const outside = structuredClone(northline)
    outside.photos[0].anchorGround.wallY = -0.1
    expect(() => validateClientConfig(outside)).toThrow(/wallY/)
  })

  it('falla si el cliente ofrece totem y una foto no tiene anchorGround, con slug e id de foto', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[1] as Partial<(typeof broken.photos)[number]>).anchorGround
    expect(() => validateClientConfig(broken)).toThrow(/northline/)
    expect(() => validateClientConfig(broken)).toThrow(/totem/)
    expect(() => validateClientConfig(broken)).toThrow(/"front-night"/)
  })

  it('sin el tipo totem anchorGround no hace falta', () => {
    const noTotem = structuredClone(northline)
    noTotem.options.types = noTotem.options.types.filter((item) => item.id !== 'totem')
    for (const photo of noTotem.photos as Partial<(typeof noTotem.photos)[number]>[]) {
      delete photo.anchorGround
    }
    expect(validateClientConfig(noTotem).photos).toHaveLength(2)
  })

  it('falla si anchorGround cae fuera de la foto o tiene metersToWidth no positivo', () => {
    const outside = structuredClone(northline)
    outside.photos[0].anchorGround.x = 1.4
    expect(() => validateClientConfig(outside)).toThrow(/photos\[0\]\.anchorGround\.x e y/)
    const flat = structuredClone(northline)
    flat.photos[0].anchorGround.metersToWidth = 0
    expect(() => validateClientConfig(flat)).toThrow(/anchorGround\.metersToWidth debe ser mayor a 0/)
  })
})

describe('priceRulesFromClient y defaultSelection', () => {
  it('las reglas salen del JSON del cliente', () => {
    const rules = priceRulesFromClient(clientOrFail('northline'))
    expect(rules.materials.map((item) => item.id)).toEqual(['pvc', 'aluminum', 'acrylic'])
    expect(rules.rangePct).toBe(8)
    expect(rules.installation).toEqual({ fixed: 350, perArea: 10, perLetter: 45 })
  })

  it('la seleccion por defecto es la primera opcion de cada lista', () => {
    const client = clientOrFail('northline')
    expect(defaultSelection(client)).toEqual({
      type: 'facade',
      text: 'NORTHLINE',
      width: 8,
      height: 3,
      letterHeight: 1,
      depthId: 'd2',
      materialId: 'pvc',
      lightingId: 'none',
      installation: false,
      quantity: 1,
    })
  })

  it('la seleccion por defecto de cada cliente calcula precio sin lanzar', () => {
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

// Las dos plantillas sin precio de SPEC 10: opcionales en la forma, fuera de las 47.
const CLAVES_DE_HIDDEN = ['whatsappMessageHidden', 'whatsappMessageHiddenLetters']

describe('claves de texto de los clientes', () => {
  // 13.16. D127: las 47 claves son un piso comun a todos los clientes. Las dos de hidden solo
  // aparecen con pricing.display hidden, y ahi se exigen si el CTA incluye WhatsApp (SPEC 10).
  it('todos los JSON tienen las mismas 47 claves, ninguna vacia, y las de hidden segun SPEC 10', () => {
    const base = Object.keys(clientOrFail('northline').texts).sort()
    expect(base).toHaveLength(47)
    let conHidden = 0
    for (const slug of listClientSlugs()) {
      const config = clientOrFail(slug)
      for (const [key, value] of Object.entries(config.texts)) {
        expect(value.trim(), `${slug}.texts.${key}`).not.toBe('')
      }
      const keys = Object.keys(config.texts)
      const extra = keys.filter((key) => !base.includes(key)).sort()
      expect(keys.filter((key) => base.includes(key)).sort(), slug).toEqual(base)
      const hidden = priceDisplayOf(config) === 'hidden'
      if (!hidden) {
        expect(extra, slug).toEqual([])
      } else {
        for (const key of extra) {
          expect(CLAVES_DE_HIDDEN, `${slug}.texts.${key}`).toContain(key)
        }
        if (config.cta !== 'form') {
          expect(extra, slug).toEqual(CLAVES_DE_HIDDEN)
          conHidden += 1
        }
      }
    }
    // Que la rama de hidden no pase en vacio.
    expect(conHidden).toBeGreaterThan(0)
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

describe('validateClientConfig: modo letters', () => {
  it('los dos clientes ofrecen letters con los valores de SPEC 5.4 y 5.5', () => {
    const en = clientOrFail('northline').options
    expect(en.types.map((item) => [item.id, item.pricing])).toEqual([
      ['facade', 'area'],
      ['totem', 'area'],
      ['letters', 'letters'],
    ])
    expect(en.materials.map((item) => item.pricePerLetterHeight)).toEqual([40, 70, 95])
    expect(en.lighting.map((item) => item.pricePerLetter)).toEqual([0, 70, 120])
    expect(en.depths.map((item) => [item.label, item.factor])).toEqual([
      ['2 in', 1],
      ['4 in', 1.2],
      ['6 in', 1.4],
    ])
    expect(en.installation.perLetter).toBe(45)
    expect(en.letterHeight).toEqual({ min: 0.5, max: 3, step: 0.25, default: 1 })

    const es = clientOrFail('norte').options
    expect(es.materials.map((item) => item.pricePerLetterHeight)).toEqual([89000, 155000, 210000])
    expect(es.lighting.map((item) => item.pricePerLetter)).toEqual([0, 47000, 81000])
    expect(es.depths.map((item) => [item.label, item.factor])).toEqual([
      ['5 cm', 1],
      ['10 cm', 1.2],
      ['15 cm', 1.4],
    ])
    expect(es.installation.perLetter).toBe(30000)
    expect(es.letterHeight).toEqual({ min: 0.15, max: 0.9, step: 0.05, default: 0.3 })
  })

  it('falla si un tipo no trae pricing, y dice cual', () => {
    const broken = structuredClone(northline)
    delete (broken.options.types[2] as Partial<(typeof broken.options.types)[number]>).pricing
    expect(() => validateClientConfig(broken)).toThrow(/options\.types\[2\]\.pricing/)
  })

  it('falla si pricing tiene un valor desconocido', () => {
    const broken = structuredClone(northline)
    broken.options.types[0].pricing = 'volume'
    expect(() => validateClientConfig(broken)).toThrow(/pricing tiene un valor invalido/)
  })

  it('falla si una iluminacion no trae pricePerLetter y el cliente ofrece letters', () => {
    const broken = structuredClone(northline)
    delete (broken.options.lighting[1] as Partial<(typeof broken.options.lighting)[number]>).pricePerLetter
    expect(() => validateClientConfig(broken)).toThrow(/options\.lighting\[1\]\.pricePerLetter/)
  })

  it('falla si ningun material trae pricePerLetterHeight y el cliente ofrece letters', () => {
    const broken = structuredClone(northline)
    for (const material of broken.options.materials) {
      delete (material as Partial<typeof material>).pricePerLetterHeight
    }
    expect(() => validateClientConfig(broken)).toThrow(/pricePerLetterHeight/)
  })

  it('falla si depths esta vacio o una profundidad no trae su medida', () => {
    const vacio = structuredClone(northline)
    vacio.options.depths = []
    expect(() => validateClientConfig(vacio)).toThrow(/options\.depths/)
    const sinMedida = structuredClone(northline)
    delete (sinMedida.options.depths[0].visual as Partial<(typeof sinMedida.options.depths)[number]['visual']>).depthMeters
    expect(() => validateClientConfig(sinMedida)).toThrow(/depthMeters/)
  })

  it('un material sin pricePerLetterHeight queda fuera del modo letters y la seleccion default lo evita', () => {
    const raw = structuredClone(northline)
    delete (raw.options.materials[0] as Partial<(typeof raw.options.materials)[number]>).pricePerLetterHeight
    raw.options.types = [raw.options.types[2], raw.options.types[0]]
    const config = validateClientConfig(raw)
    expect(materialsForMode(config.options, 'letters').map((item) => item.id)).toEqual(['aluminum', 'acrylic'])
    expect(defaultSelection(config).materialId).toBe('aluminum')
    expect(pricingModeOf(config.options, 'facade')).toBe('area')
  })
})

describe('validateClientConfig: camara del anchor', () => {
  it('falla si falta cameraYawDeg, y dice cual', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[0].anchor as Partial<(typeof broken.photos)[number]['anchor']>).cameraYawDeg
    expect(() => validateClientConfig(broken)).toThrow(/photos\[0\]\.anchor\.cameraYawDeg/)
  })

  it('falla si fovDeg no esta entre 0 y 180', () => {
    const broken = structuredClone(northline)
    broken.photos[1].anchor.fovDeg = 180
    expect(() => validateClientConfig(broken)).toThrow(/photos\[1\]\.anchor\.fovDeg/)
    broken.photos[1].anchor.fovDeg = 0
    expect(() => validateClientConfig(broken)).toThrow(/fovDeg/)
  })

  it('viewSignOnly sale del JSON en los dos idiomas', () => {
    expect(clientOrFail('northline').texts.viewSignOnly).toBe('The sign')
    expect(clientOrFail('norte').texts.viewSignOnly).toBe('Solo el cartel')
  })

  it('loadingLabel sale del JSON en los dos idiomas y es requerida', () => {
    expect(clientOrFail('northline').texts.loadingLabel).toBe('Preparing your sign')
    expect(clientOrFail('norte').texts.loadingLabel).toBe('Preparando tu cartel')
    const broken = structuredClone(northline) as { texts: Record<string, string> }
    delete broken.texts.loadingLabel
    expect(() => validateClientConfig(broken)).toThrow(/loadingLabel/)
  })
})

// northline tiene cta "both", asi que en hidden la validacion exige las dos plantillas sin
// precio. Van en todos los helpers que arman un cliente hidden.
const HIDDEN_TEMPLATES = {
  whatsappMessageHidden: 'Hi, I want a {type} of {width} x {height} {unit}.',
  whatsappMessageHiddenLetters: 'Hi, I want {letters} letters of {letterHeight} {unit}.',
}

describe('validateClientConfig: pricing.display', () => {
  // Un JSON con el objeto pricing, que ningun cliente de la demo trae.
  function withDisplay(display: unknown) {
    const raw = structuredClone(northline) as Record<string, unknown>
    raw.pricing = { display }
    raw.texts = { ...(raw.texts as Record<string, string>), ...HIDDEN_TEMPLATES }
    return raw
  }

  // D127: es propio de la demo, se fija por slug.
  it('los dos clientes de la demo no traen pricing y sirven range', () => {
    for (const slug of ['northline', 'norte']) {
      const config = clientOrFail(slug)
      expect(config.pricing).toBeUndefined()
      expect(priceDisplayOf(config)).toBe('range')
    }
    expect(DEFAULT_PRICE_DISPLAY).toBe('range')
  })

  it('sin el objeto, o con el objeto y sin display, vale range', () => {
    const raw = structuredClone(northline) as Record<string, unknown>
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

describe('validateClientConfig: plantillas de WhatsApp sin precio', () => {
  function hidden(cta: string, texts: Record<string, string> = {}) {
    const raw = structuredClone(northline) as Record<string, unknown>
    raw.pricing = { display: 'hidden' }
    raw.cta = cta
    raw.texts = { ...(raw.texts as Record<string, string>), ...texts }
    return raw
  }

  const BOTH = HIDDEN_TEMPLATES

  it('con hidden y cta whatsapp o both, exige las dos claves y nombra la que falta', () => {
    for (const cta of ['whatsapp', 'both']) {
      expect(() => validateClientConfig(hidden(cta))).toThrow(/whatsappMessageHidden"/)
      const onlyArea = { whatsappMessageHidden: BOTH.whatsappMessageHidden }
      expect(() => validateClientConfig(hidden(cta, onlyArea))).toThrow(/whatsappMessageHiddenLetters"/)
      expect(validateClientConfig(hidden(cta, BOTH)).texts.whatsappMessageHidden).toBe(
        BOTH.whatsappMessageHidden,
      )
    }
  })

  it('con hidden y cta form no hacen falta: no hay boton de WhatsApp', () => {
    expect(validateClientConfig(hidden('form')).texts.whatsappMessageHidden).toBeUndefined()
  })

  it('fuera de hidden no hacen falta, y las 47 claves requeridas no cambian', () => {
    const raw = structuredClone(northline) as Record<string, unknown>
    expect(validateClientConfig(raw).texts.whatsappMessageHidden).toBeUndefined()
  })

  it('si la clave esta pero vacia, falla: una plantilla vacia manda un mensaje en blanco', () => {
    expect(() => validateClientConfig(hidden('both', { ...BOTH, whatsappMessageHidden: '' }))).toThrow(
      /whatsappMessageHidden/,
    )
  })
})

describe('el motor no cambia con el modo de visibilidad', () => {
  // SPEC 6.2: lo que se agrega decide quien ve el resultado, no como se calcula.
  it('calculatePrice da la misma salida con los tres valores de display', () => {
    const base = structuredClone(northline) as Record<string, unknown>
    const selection = defaultSelection(validateClientConfig(base))
    const results = (['exact', 'range', 'hidden'] as const).map((display) => {
      const raw = structuredClone(northline) as Record<string, unknown>
      raw.pricing = { display }
      raw.texts = { ...(raw.texts as Record<string, string>), ...HIDDEN_TEMPLATES }
      const config = validateClientConfig(raw)
      return calculatePrice(priceRulesFromClient(config), selection)
    })
    const [exact, range, hiddenResult] = results
    expect(range).toEqual(exact)
    expect(hiddenResult).toEqual(exact)
    // Y contra el cliente sin la clave, que es el de la demo.
    expect(calculatePrice(priceRulesFromClient(validateClientConfig(base)), selection)).toEqual(exact)
  })
})
