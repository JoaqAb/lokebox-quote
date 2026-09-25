import { describe, expect, it } from 'vitest'
import { listClientSlugs } from '../../clients'
import northline from '../../clients/northline.json'
import { HIDDEN_TEMPLATE_KEYS, SIGN_TEXT_KEYS, defaultSelection, materialsForMode, priceRulesFromClient, pricingModeOf } from './config'
import { calculateSignPrice } from './pricing/calculateSignPrice'
import { signsClientOf, signsConfigOf, validateSignsJson } from './testing'

// Hasta la version 2.12 estos tests estaban en src/core/clientConfig.test.ts. Desde 2.13 (D133)
// la validacion de units, photos, options y las 20 claves de texts es de la vertical: validateSignsJson
// pasa el JSON por el core y por la vertical, en el orden de la app, con los mismos mensajes.

describe('validateClientConfig', () => {
  // Version 2.4, D68.
  it('mount es obligatorio en los tipos de area, flush o standoff, y letters no lo lleva', () => {
    const config = validateSignsJson(structuredClone(northline))
    const mounts = Object.fromEntries(config.options.types.map((item) => [item.id, item.visual?.mount]))
    expect(mounts).toEqual({ facade: 'standoff', totem: 'flush', letters: undefined })
    const missing = structuredClone(northline) as unknown as { options: { types: { visual?: unknown }[] } }
    delete missing.options.types[0].visual
    expect(() => validateSignsJson(missing)).toThrow(/"facade".*visual.mount/)
    const wrong = structuredClone(northline) as unknown as { options: { types: { visual: { mount: string } }[] } }
    wrong.options.types[1].visual.mount = 'glued'
    expect(() => validateSignsJson(wrong)).toThrow(/"totem".*"glued"/)
  })

  it('falla si options.materials esta vacio', () => {
    const broken = structuredClone(northline)
    broken.options.materials = []
    expect(() => validateSignsJson(broken)).toThrow(/options.materials/)
  })

  it('falla si un material trae un finish que no existe, nombrandolo', () => {
    const broken = structuredClone(northline) as unknown as { options: { materials: { visual: { finish: string } }[] } }
    broken.options.materials[0].visual.finish = 'glossy'
    expect(() => validateSignsJson(broken)).toThrow(/options.materials\[0\].visual.finish "glossy"/)
  })

  it('falla si falta un parametro fisico o sale de 0 a 1', () => {
    const missing = structuredClone(northline)
    delete (missing.options.materials[2].visual as Partial<(typeof missing.options.materials)[number]['visual']>).clearcoat
    expect(() => validateSignsJson(missing)).toThrow(/options.materials\[2\].visual.clearcoat/)
    const outside = structuredClone(northline)
    outside.options.materials[1].visual.anisotropy = 1.5
    expect(() => validateSignsJson(outside)).toThrow(/visual.anisotropy vale 1.5/)
  })

  it('falla si hay ids repetidos', () => {
    const broken = structuredClone(northline)
    broken.options.materials[1].id = 'pvc'
    expect(() => validateSignsJson(broken)).toThrow(/repetido/)
  })

  it('falla si el default no cae dentro del rango', () => {
    const broken = structuredClone(northline)
    broken.options.width.default = 99
    expect(() => validateSignsJson(broken)).toThrow(/fuera del rango/)
  })

  it('falla si el default no es multiplo del step', () => {
    const broken = structuredClone(northline)
    broken.options.height.default = 3.2
    expect(() => validateSignsJson(broken)).toThrow(/multiplo/)
  })

  it('falla si los descuentos no estan ordenados por minQty', () => {
    const broken = structuredClone(northline)
    broken.options.discounts = [
      { minQty: 5, pct: 10 },
      { minQty: 2, pct: 5 },
    ]
    expect(() => validateSignsJson(broken)).toThrow(/ascendente/)
  })

})

describe('validateClientConfig: photos', () => {
  it('los dos clientes traen las dos fotos frontales con ids unicos', () => {
    for (const slug of ['northline', 'norte']) {
      const photos = signsClientOf(slug).photos
      expect(photos.map((item) => item.id)).toEqual(['front-day', 'front-night'])
      for (const photo of photos) {
        expect(photo.src).toBe(`/assets/quote/backgrounds/${slug}-${photo.id}.webp`)
      }
    }
  })

  it('falla si falta photos, y dice en que cliente', () => {
    const broken: Record<string, unknown> = structuredClone(northline)
    delete broken.photos
    expect(() => validateSignsJson(broken)).toThrow(/northline/)
    expect(() => validateSignsJson(broken)).toThrow(/photos/)
  })

  it('falla si photos esta vacio', () => {
    const broken = structuredClone(northline)
    broken.photos = []
    expect(() => validateSignsJson(broken)).toThrow(/photos/)
  })

  it('falla si falta una clave del anchor, y dice cual', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[1].anchor as Partial<(typeof broken.photos)[number]['anchor']>).metersToWidth
    expect(() => validateSignsJson(broken)).toThrow(/photos\[1\]\.anchor\.metersToWidth/)
  })

  it('falla si x o y del anchor caen fuera de 0 a 1', () => {
    const broken = structuredClone(northline)
    broken.photos[0].anchor.y = 1.2
    expect(() => validateSignsJson(broken)).toThrow(/photos\[0\]\.anchor\.x e y/)
  })

  it('falla si metersToWidth no es mayor a 0', () => {
    const broken = structuredClone(northline)
    broken.photos[1].anchor.metersToWidth = 0
    expect(() => validateSignsJson(broken)).toThrow(/metersToWidth debe ser mayor a 0/)
  })

  it('falla si hay ids de foto repetidos', () => {
    const broken = structuredClone(northline)
    broken.photos[1].id = 'front-day'
    expect(() => validateSignsJson(broken)).toThrow(/repetido/)
  })
})

describe('validateClientConfig: anchorGround', () => {
  // Version 2.7 (D85): wallY es de cada foto, porque la linea de fachada cae distinto en cada una.
  it('las dos fotos de los dos clientes traen anchorGround, compartido entre Front y Night salvo wallY', () => {
    for (const slug of ['northline', 'norte']) {
      const [day, night] = signsClientOf(slug).photos
      expect(day.anchorGround).toBeDefined()
      expect({ ...night.anchorGround, wallY: 0 }).toEqual({ ...day.anchorGround, wallY: 0 })
      // El totem esta mas cerca de la camara que la fachada.
      expect(day.anchorGround?.metersToWidth).toBeGreaterThan(day.anchor.metersToWidth)
    }
  })

  it('wallY es obligatorio, entre 0 y 1 y por encima del apoyo', () => {
    for (const slug of ['northline', 'norte']) {
      for (const photo of signsClientOf(slug).photos) {
        const ground = photo.anchorGround
        expect(ground?.wallY).toBeGreaterThan(0)
        expect(ground?.wallY).toBeLessThan(ground?.y ?? 0)
      }
    }
    const missing = structuredClone(northline) as unknown as { photos: { anchorGround: { wallY?: number } }[] }
    delete missing.photos[0].anchorGround.wallY
    expect(() => validateSignsJson(missing)).toThrow(/anchorGround.wallY/)
    const below = structuredClone(northline)
    below.photos[1].anchorGround.wallY = 0.95
    expect(() => validateSignsJson(below)).toThrow(/photos\[1\].anchorGround.wallY/)
    const outside = structuredClone(northline)
    outside.photos[0].anchorGround.wallY = -0.1
    expect(() => validateSignsJson(outside)).toThrow(/wallY/)
  })

  it('falla si el cliente ofrece totem y una foto no tiene anchorGround, con slug e id de foto', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[1] as Partial<(typeof broken.photos)[number]>).anchorGround
    expect(() => validateSignsJson(broken)).toThrow(/northline/)
    expect(() => validateSignsJson(broken)).toThrow(/totem/)
    expect(() => validateSignsJson(broken)).toThrow(/"front-night"/)
  })

  it('sin el tipo totem anchorGround no hace falta', () => {
    const noTotem = structuredClone(northline)
    noTotem.options.types = noTotem.options.types.filter((item) => item.id !== 'totem')
    for (const photo of noTotem.photos as Partial<(typeof noTotem.photos)[number]>[]) {
      delete photo.anchorGround
    }
    expect(validateSignsJson(noTotem).photos).toHaveLength(2)
  })

  it('falla si anchorGround cae fuera de la foto o tiene metersToWidth no positivo', () => {
    const outside = structuredClone(northline)
    outside.photos[0].anchorGround.x = 1.4
    expect(() => validateSignsJson(outside)).toThrow(/photos\[0\]\.anchorGround\.x e y/)
    const flat = structuredClone(northline)
    flat.photos[0].anchorGround.metersToWidth = 0
    expect(() => validateSignsJson(flat)).toThrow(/anchorGround\.metersToWidth debe ser mayor a 0/)
  })
})

describe('priceRulesFromClient y defaultSelection', () => {
  it('las reglas salen del JSON del cliente', () => {
    const rules = priceRulesFromClient(signsClientOf('northline'))
    expect(rules.materials.map((item) => item.id)).toEqual(['pvc', 'aluminum', 'acrylic'])
    expect(rules.rangePct).toBe(8)
    expect(rules.installation).toEqual({ fixed: 350, perArea: 10, perLetter: 45 })
  })

  it('la seleccion por defecto es la primera opcion de cada lista', () => {
    const client = signsClientOf('northline')
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
      const client = signsClientOf(slug)
      const result = calculateSignPrice(priceRulesFromClient(client), defaultSelection(client))
      expect(result.total).toBeGreaterThan(0)
    }
  })
})

describe('validateClientConfig: modo letters', () => {
  it('los dos clientes ofrecen letters con los valores de SPEC 5.4 y 5.5', () => {
    const en = signsClientOf('northline').options
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

    const es = signsClientOf('norte').options
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
    expect(() => validateSignsJson(broken)).toThrow(/options\.types\[2\]\.pricing/)
  })

  it('falla si pricing tiene un valor desconocido', () => {
    const broken = structuredClone(northline)
    broken.options.types[0].pricing = 'volume'
    expect(() => validateSignsJson(broken)).toThrow(/pricing tiene un valor invalido/)
  })

  it('falla si una iluminacion no trae pricePerLetter y el cliente ofrece letters', () => {
    const broken = structuredClone(northline)
    delete (broken.options.lighting[1] as Partial<(typeof broken.options.lighting)[number]>).pricePerLetter
    expect(() => validateSignsJson(broken)).toThrow(/options\.lighting\[1\]\.pricePerLetter/)
  })

  it('falla si ningun material trae pricePerLetterHeight y el cliente ofrece letters', () => {
    const broken = structuredClone(northline)
    for (const material of broken.options.materials) {
      delete (material as Partial<typeof material>).pricePerLetterHeight
    }
    expect(() => validateSignsJson(broken)).toThrow(/pricePerLetterHeight/)
  })

  it('falla si depths esta vacio o una profundidad no trae su medida', () => {
    const vacio = structuredClone(northline)
    vacio.options.depths = []
    expect(() => validateSignsJson(vacio)).toThrow(/options\.depths/)
    const sinMedida = structuredClone(northline)
    delete (sinMedida.options.depths[0].visual as Partial<(typeof sinMedida.options.depths)[number]['visual']>).depthMeters
    expect(() => validateSignsJson(sinMedida)).toThrow(/depthMeters/)
  })

  it('un material sin pricePerLetterHeight queda fuera del modo letters y la seleccion default lo evita', () => {
    const raw = structuredClone(northline)
    delete (raw.options.materials[0] as Partial<(typeof raw.options.materials)[number]>).pricePerLetterHeight
    raw.options.types = [raw.options.types[2], raw.options.types[0]]
    const config = validateSignsJson(raw)
    expect(materialsForMode(config.options, 'letters').map((item) => item.id)).toEqual(['aluminum', 'acrylic'])
    expect(defaultSelection(config).materialId).toBe('aluminum')
    expect(pricingModeOf(config.options, 'facade')).toBe('area')
  })
})

describe('validateClientConfig: camara del anchor', () => {
  it('falla si falta cameraYawDeg, y dice cual', () => {
    const broken = structuredClone(northline)
    delete (broken.photos[0].anchor as Partial<(typeof broken.photos)[number]['anchor']>).cameraYawDeg
    expect(() => validateSignsJson(broken)).toThrow(/photos\[0\]\.anchor\.cameraYawDeg/)
  })

  it('falla si fovDeg no esta entre 0 y 180', () => {
    const broken = structuredClone(northline)
    broken.photos[1].anchor.fovDeg = 180
    expect(() => validateSignsJson(broken)).toThrow(/photos\[1\]\.anchor\.fovDeg/)
    broken.photos[1].anchor.fovDeg = 0
    expect(() => validateSignsJson(broken)).toThrow(/fovDeg/)
  })

  it('viewSignOnly sale del JSON en los dos idiomas', () => {
    expect(signsClientOf('northline').texts.viewSignOnly).toBe('The sign')
    expect(signsClientOf('norte').texts.viewSignOnly).toBe('Solo el cartel')
  })

})

// northline tiene cta "both", asi que en hidden la validacion exige las dos plantillas sin
// precio. Van en todos los helpers que arman un cliente hidden.
const HIDDEN_TEMPLATES = {
  whatsappMessageHidden: 'Hi, I want a {type} of {width} x {height} {unit}.',
  whatsappMessageHiddenLetters: 'Hi, I want {letters} letters of {letterHeight} {unit}.',
}

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
      expect(() => validateSignsJson(hidden(cta))).toThrow(/whatsappMessageHidden"/)
      const onlyArea = { whatsappMessageHidden: BOTH.whatsappMessageHidden }
      expect(() => validateSignsJson(hidden(cta, onlyArea))).toThrow(/whatsappMessageHiddenLetters"/)
      expect(validateSignsJson(hidden(cta, BOTH)).texts.whatsappMessageHidden).toBe(
        BOTH.whatsappMessageHidden,
      )
    }
  })

  it('con hidden y cta form no hacen falta: no hay boton de WhatsApp', () => {
    expect(validateSignsJson(hidden('form')).texts.whatsappMessageHidden).toBeUndefined()
  })

  it('fuera de hidden no hacen falta, y las 47 claves requeridas no cambian', () => {
    const raw = structuredClone(northline) as Record<string, unknown>
    expect(validateSignsJson(raw).texts.whatsappMessageHidden).toBeUndefined()
  })

  it('si la clave esta pero vacia, falla: una plantilla vacia manda un mensaje en blanco', () => {
    expect(() => validateSignsJson(hidden('both', { ...BOTH, whatsappMessageHidden: '' }))).toThrow(
      /whatsappMessageHidden/,
    )
  })
})

describe('el motor no cambia con el modo de visibilidad', () => {
  // SPEC 6.2: lo que se agrega decide quien ve el resultado, no como se calcula.
  it('calculatePrice da la misma salida con los tres valores de display', () => {
    const base = structuredClone(northline) as Record<string, unknown>
    const selection = defaultSelection(validateSignsJson(base))
    const results = (['exact', 'range', 'hidden'] as const).map((display) => {
      const raw = structuredClone(northline) as Record<string, unknown>
      raw.pricing = { display }
      raw.texts = { ...(raw.texts as Record<string, string>), ...HIDDEN_TEMPLATES }
      const config = validateSignsJson(raw)
      return calculateSignPrice(priceRulesFromClient(config), selection)
    })
    const [exact, range, hiddenResult] = results
    expect(range).toEqual(exact)
    expect(hiddenResult).toEqual(exact)
    // Y contra el cliente sin la clave, que es el de la demo.
    expect(calculateSignPrice(priceRulesFromClient(validateSignsJson(base)), selection)).toEqual(exact)
  })
})

// Las 20 claves de carteles de SPEC 10 (D135), en el orden de la lista.
const CLAVES_DE_CARTELES = [
  'typeLabel',
  'widthLabel',
  'heightLabel',
  'materialLabel',
  'lightingLabel',
  'installationLabel',
  'installationYes',
  'installationNo',
  'quantityLabel',
  'signTextLabel',
  'letterHeightLabel',
  'depthLabel',
  'previewZoomLabel',
  'viewSignOnly',
  'lineMaterial',
  'lineLighting',
  'lineType',
  'lineInstallation',
  'whatsappMessage',
  'whatsappMessageLetters',
]

describe('claves de texto de carteles', () => {
  // 13.16, parte de carteles (hasta 2.12 era el test de las 47 claves). D127: las 20 son un piso
  // comun a todos los clientes. Las dos de hidden solo aparecen con pricing.display hidden, y ahi
  // se exigen si el CTA incluye WhatsApp (SPEC 10).
  it('la vertical valida las 20 claves de SPEC 10 y las dos de hidden, en todos los clientes', () => {
    expect(SIGN_TEXT_KEYS).toEqual(CLAVES_DE_CARTELES)
    expect(HIDDEN_TEMPLATE_KEYS).toEqual(['whatsappMessageHidden', 'whatsappMessageHiddenLetters'])
    let conHidden = 0
    for (const slug of listClientSlugs()) {
      const client = signsClientOf(slug)
      const texts = signsConfigOf(slug).texts
      const keys = Object.keys(texts)
      for (const [key, value] of Object.entries(texts)) {
        expect(value.trim(), `${slug}.texts.${key}`).not.toBe('')
      }
      expect(keys.filter((key) => CLAVES_DE_CARTELES.includes(key)).sort(), slug).toEqual([...CLAVES_DE_CARTELES].sort())
      const extra = keys.filter((key) => !CLAVES_DE_CARTELES.includes(key)).sort()
      if (client.display !== 'hidden') {
        expect(extra, slug).toEqual([])
      } else {
        for (const key of extra) {
          expect(HIDDEN_TEMPLATE_KEYS, `${slug}.texts.${key}`).toContain(key)
        }
        if (client.cta !== 'form') {
          expect(extra, slug).toEqual([...HIDDEN_TEMPLATE_KEYS])
          conHidden += 1
        }
      }
    }
    // Que la rama de hidden no pase en vacio.
    expect(conHidden).toBeGreaterThan(0)
  })

  // 13.17, parte de carteles: cada una de las 20, no solo las nuevas.
  it('el validador rechaza una config a la que le falta cada una de las 20 claves', () => {
    for (const key of CLAVES_DE_CARTELES) {
      const broken = structuredClone(northline) as { texts: Record<string, string> }
      delete broken.texts[key]
      expect(() => validateSignsJson(broken), key).toThrow(`Cliente "northline": falta la clave de texto "${key}" o no es un string no vacio.`)
      broken.texts[key] = ''
      expect(() => validateSignsJson(broken), key).toThrow(`"${key}"`)
    }
  })
})

describe('validateSignsJson: recargo del tipo', () => {
  // TAREA_032: la linea de tipo entra solo cuando suma y composePrice suma solo las lineas que
  // recibe, asi que un recargo negativo se rechaza al cargar en vez de restar sin linea.
  it('falla si un tipo trae priceFixed negativo, nombrando el tipo; 0 y positivo pasan', () => {
    const broken = structuredClone(northline)
    broken.options.types[1].priceFixed = -50
    expect(() => validateSignsJson(broken)).toThrow('Cliente "northline": options.types[1].priceFixed no puede ser negativo.')
    const zero = structuredClone(northline)
    zero.options.types[1].priceFixed = 0
    expect(validateSignsJson(zero).options.types[1].priceFixed).toBe(0)
    expect(validateSignsJson(structuredClone(northline)).options.types[1].priceFixed).toBeGreaterThan(0)
  })
})
