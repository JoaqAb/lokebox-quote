import type {
  ClientConfig,
  ClientPhoto,
  ClientTexts,
  CtaMode,
  DepthOption,
  DiscountTier,
  LightingMode,
  LightingOption,
  MaterialOption,
  MaterialVisual,
  PhotoGroundAnchor,
  PriceDisplay,
  PriceRules,
  PricingMode,
  QuantityConfig,
  RangeConfig,
  SignOptions,
  SignTextConfig,
  SignSelection,
  SignTypeOption,
} from './types'
import { FINISHES, isFinish } from './preview/finishMaps'

// Validacion de la forma del JSON de cliente en runtime, sin librerias.
// Si algo falta o no cierra, se lanza con un mensaje que dice que falta y en que cliente.
// SPEC seccion 10.

function isCtaMode(value: string): value is CtaMode {
  return value === 'whatsapp' || value === 'form' || value === 'both'
}

function isPricingMode(value: string): value is PricingMode {
  return value === 'area' || value === 'letters'
}

function isLightingMode(value: string): value is LightingMode {
  return value === 'none' || value === 'front' || value === 'back'
}

// Tolerancia para comparar multiplos de step con aritmetica de punto flotante.
const STEP_EPSILON = 1e-6

type Raw = Record<string, unknown>

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(slug: string, message: string): never {
  throw new Error(`Cliente "${slug}": ${message}`)
}

function readObject(parent: Raw, key: string, slug: string, path: string): Raw {
  const value = parent[key]
  if (!isObject(value)) {
    fail(slug, `falta ${path} o no es un objeto.`)
  }
  return value
}

function readArray(parent: Raw, key: string, slug: string, path: string): unknown[] {
  const value = parent[key]
  if (!Array.isArray(value)) {
    fail(slug, `falta ${path} o no es una lista.`)
  }
  return value
}

function readString(parent: Raw, key: string, slug: string, path: string): string {
  const value = parent[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `falta ${path} o no es un string no vacio.`)
  }
  return value
}

function readNumber(parent: Raw, key: string, slug: string, path: string): number {
  const value = parent[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(slug, `falta ${path} o no es un numero.`)
  }
  return value
}

// Clave opcional: ausente devuelve undefined, presente tiene que ser un numero >= 0.
function readOptionalPrice(parent: Raw, key: string, slug: string, path: string): number | undefined {
  if (parent[key] === undefined) {
    return undefined
  }
  const value = readNumber(parent, key, slug, path)
  if (value < 0) {
    fail(slug, `${path} no puede ser negativo.`)
  }
  return value
}

function readBoolean(parent: Raw, key: string, slug: string, path: string): boolean {
  const value = parent[key]
  if (typeof value !== 'boolean') {
    fail(slug, `falta ${path} o no es un booleano.`)
  }
  return value
}

function readRange(parent: Raw, key: string, slug: string, path: string): RangeConfig {
  const raw = readObject(parent, key, slug, path)
  const range: RangeConfig = {
    min: readNumber(raw, 'min', slug, `${path}.min`),
    max: readNumber(raw, 'max', slug, `${path}.max`),
    step: readNumber(raw, 'step', slug, `${path}.step`),
    default: readNumber(raw, 'default', slug, `${path}.default`),
  }
  if (range.min <= 0) {
    fail(slug, `${path}.min debe ser mayor a 0.`)
  }
  if (range.max <= range.min) {
    fail(slug, `${path}.max debe ser mayor a ${path}.min.`)
  }
  if (range.step <= 0) {
    fail(slug, `${path}.step debe ser mayor a 0.`)
  }
  if (range.default < range.min || range.default > range.max) {
    fail(slug, `${path}.default (${String(range.default)}) esta fuera del rango.`)
  }
  const steps = (range.default - range.min) / range.step
  if (Math.abs(steps - Math.round(steps)) > STEP_EPSILON) {
    fail(slug, `${path}.default (${String(range.default)}) no es un multiplo de ${path}.step.`)
  }
  return range
}

function readQuantity(parent: Raw, key: string, slug: string, path: string): QuantityConfig {
  const raw = readObject(parent, key, slug, path)
  const quantity: QuantityConfig = {
    min: readNumber(raw, 'min', slug, `${path}.min`),
    max: readNumber(raw, 'max', slug, `${path}.max`),
    default: readNumber(raw, 'default', slug, `${path}.default`),
  }
  if (quantity.min < 1) {
    fail(slug, `${path}.min debe ser al menos 1.`)
  }
  if (quantity.max < quantity.min) {
    fail(slug, `${path}.max debe ser mayor o igual a ${path}.min.`)
  }
  if (quantity.default < quantity.min || quantity.default > quantity.max) {
    fail(slug, `${path}.default (${String(quantity.default)}) esta fuera del rango.`)
  }
  return quantity
}

function readSignText(options: Raw, slug: string): SignTextConfig {
  const raw = readObject(options, 'signText', slug, 'options.signText')
  const config: SignTextConfig = {
    default: readString(raw, 'default', slug, 'options.signText.default'),
    maxLength: readNumber(raw, 'maxLength', slug, 'options.signText.maxLength'),
  }
  if (!Number.isInteger(config.maxLength) || config.maxLength < 1) {
    fail(slug, 'options.signText.maxLength debe ser un entero mayor o igual a 1.')
  }
  if (config.default.length > config.maxLength) {
    fail(
      slug,
      `options.signText.default tiene ${String(config.default.length)} caracteres y el maximo es ${String(config.maxLength)}.`,
    )
  }
  return config
}

function requireUniqueIds(ids: string[], slug: string, path: string): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      fail(slug, `${path} tiene el id repetido "${id}".`)
    }
    seen.add(id)
  }
}

function requireNotEmpty(list: unknown[], slug: string, path: string): void {
  if (list.length === 0) {
    fail(slug, `${path} no puede estar vacio.`)
  }
}

function readEntry(value: unknown, slug: string, path: string): Raw {
  if (!isObject(value)) {
    fail(slug, `${path} no es un objeto.`)
  }
  return value
}

function readTypes(options: Raw, slug: string): SignTypeOption[] {
  const rawList = readArray(options, 'types', slug, 'options.types')
  requireNotEmpty(rawList, slug, 'options.types')
  const types = rawList.map((item, index): SignTypeOption => {
    const path = `options.types[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const pricing = readString(raw, 'pricing', slug, `${path}.pricing`)
    if (!isPricingMode(pricing)) {
      fail(slug, `${path}.pricing tiene un valor invalido: "${pricing}".`)
    }
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      priceFixed: readNumber(raw, 'priceFixed', slug, `${path}.priceFixed`),
      pricing,
    }
  })
  requireUniqueIds(
    types.map((item) => item.id),
    slug,
    'options.types',
  )
  return types
}

// Parametro fisico de un material: numero entre 0 y 1 (SPEC 10, version 2.1).
function readUnit(parent: Raw, key: string, slug: string, path: string): number {
  const value = readNumber(parent, key, slug, path)
  if (value < 0 || value > 1) {
    fail(slug, `${path} vale ${String(value)} y tiene que estar entre 0 y 1.`)
  }
  return value
}

function readMaterialVisual(visual: Raw, slug: string, path: string): MaterialVisual {
  const finish = readString(visual, 'finish', slug, `${path}.finish`)
  if (!isFinish(finish)) {
    fail(slug, `${path}.finish "${finish}" no es un acabado valido: los acabados son ${FINISHES.join(', ')}.`)
  }
  const unit = (key: Exclude<keyof MaterialVisual, 'color' | 'finish'>) => readUnit(visual, key, slug, `${path}.${key}`)
  return {
    color: readString(visual, 'color', slug, `${path}.color`),
    finish,
    metalness: unit('metalness'),
    roughness: unit('roughness'),
    specularIntensity: unit('specularIntensity'),
    clearcoat: unit('clearcoat'),
    clearcoatRoughness: unit('clearcoatRoughness'),
    anisotropy: unit('anisotropy'),
    normalScale: unit('normalScale'),
    translucency: unit('translucency'),
  }
}

function readMaterials(options: Raw, slug: string): MaterialOption[] {
  const rawList = readArray(options, 'materials', slug, 'options.materials')
  requireNotEmpty(rawList, slug, 'options.materials')
  const materials = rawList.map((item, index): MaterialOption => {
    const path = `options.materials[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      pricePerArea: readNumber(raw, 'pricePerArea', slug, `${path}.pricePerArea`),
      pricePerLetterHeight: readOptionalPrice(raw, 'pricePerLetterHeight', slug, `${path}.pricePerLetterHeight`),
      visual: readMaterialVisual(visual, slug, `${path}.visual`),
    }
  })
  requireUniqueIds(
    materials.map((item) => item.id),
    slug,
    'options.materials',
  )
  return materials
}

function readLighting(options: Raw, slug: string): LightingOption[] {
  const rawList = readArray(options, 'lighting', slug, 'options.lighting')
  requireNotEmpty(rawList, slug, 'options.lighting')
  const lighting = rawList.map((item, index): LightingOption => {
    const path = `options.lighting[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const mode = readString(visual, 'mode', slug, `${path}.visual.mode`)
    if (!isLightingMode(mode)) {
      fail(slug, `${path}.visual.mode tiene un valor invalido: "${mode}".`)
    }
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      pricePerArea: readNumber(raw, 'pricePerArea', slug, `${path}.pricePerArea`),
      pricePerLetter: readOptionalPrice(raw, 'pricePerLetter', slug, `${path}.pricePerLetter`),
      visual: { mode },
    }
  })
  requireUniqueIds(
    lighting.map((item) => item.id),
    slug,
    'options.lighting',
  )
  return lighting
}

function readDepths(options: Raw, slug: string): DepthOption[] {
  const rawList = readArray(options, 'depths', slug, 'options.depths')
  requireNotEmpty(rawList, slug, 'options.depths')
  const depths = rawList.map((item, index): DepthOption => {
    const path = `options.depths[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const factor = readNumber(raw, 'factor', slug, `${path}.factor`)
    const depthMeters = readNumber(visual, 'depthMeters', slug, `${path}.visual.depthMeters`)
    if (factor <= 0) {
      fail(slug, `${path}.factor debe ser mayor a 0.`)
    }
    if (depthMeters <= 0) {
      fail(slug, `${path}.visual.depthMeters debe ser mayor a 0.`)
    }
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      factor,
      visual: { depthMeters },
    }
  })
  requireUniqueIds(
    depths.map((item) => item.id),
    slug,
    'options.depths',
  )
  return depths
}

// Si el cliente ofrece un tipo letters, sus precios tienen que estar completos: todas las
// iluminaciones con pricePerLetter y al menos un material con pricePerLetterHeight.
// Se valida al cargar, asi un JSON a medias no llega al motor.
function requireLettersPrices(options: SignOptions, slug: string): void {
  if (!options.types.some((item) => item.pricing === 'letters')) {
    return
  }
  options.lighting.forEach((item, index) => {
    if (item.pricePerLetter === undefined) {
      fail(slug, `options.lighting[${String(index)}].pricePerLetter falta y el cliente ofrece letras corporeas.`)
    }
  })
  if (!options.materials.some((item) => item.pricePerLetterHeight !== undefined)) {
    fail(slug, 'ningun material de options.materials tiene pricePerLetterHeight y el cliente ofrece letras corporeas.')
  }
}

function readDiscounts(options: Raw, slug: string): DiscountTier[] {
  const rawList = readArray(options, 'discounts', slug, 'options.discounts')
  const discounts = rawList.map((item, index): DiscountTier => {
    const path = `options.discounts[${String(index)}]`
    const raw = readEntry(item, slug, path)
    return {
      minQty: readNumber(raw, 'minQty', slug, `${path}.minQty`),
      pct: readNumber(raw, 'pct', slug, `${path}.pct`),
    }
  })
  for (let index = 1; index < discounts.length; index += 1) {
    const previous = discounts[index - 1]
    const current = discounts[index]
    if (current.minQty <= previous.minQty) {
      fail(slug, 'options.discounts debe estar ordenado por minQty ascendente y sin repetidos.')
    }
  }
  return discounts
}

function readOptions(raw: Raw, slug: string): SignOptions {
  const options = readObject(raw, 'options', slug, 'options')
  const installation = readObject(options, 'installation', slug, 'options.installation')
  const result: SignOptions = {
    types: readTypes(options, slug),
    signText: readSignText(options, slug),
    width: readRange(options, 'width', slug, 'options.width'),
    height: readRange(options, 'height', slug, 'options.height'),
    letterHeight: readRange(options, 'letterHeight', slug, 'options.letterHeight'),
    depths: readDepths(options, slug),
    materials: readMaterials(options, slug),
    lighting: readLighting(options, slug),
    installation: {
      fixed: readNumber(installation, 'fixed', slug, 'options.installation.fixed'),
      perArea: readNumber(installation, 'perArea', slug, 'options.installation.perArea'),
      perLetter: readNumber(installation, 'perLetter', slug, 'options.installation.perLetter'),
    },
    quantity: readQuantity(options, 'quantity', slug, 'options.quantity'),
    discounts: readDiscounts(options, slug),
    rangePct: readNumber(options, 'rangePct', slug, 'options.rangePct'),
  }
  requireLettersPrices(result, slug)
  return result
}

// Anclaje del totem en una foto (SPEC 10, version 1.15). Opcional en la forma: si falta
// devuelve undefined, y la regla de que el totem lo exige se aplica con las opciones leidas.
function readGroundAnchor(entry: Raw, slug: string, path: string): PhotoGroundAnchor | undefined {
  if (entry.anchorGround === undefined) {
    return undefined
  }
  const ground = readObject(entry, 'anchorGround', slug, `${path}.anchorGround`)
  const x = readNumber(ground, 'x', slug, `${path}.anchorGround.x`)
  const y = readNumber(ground, 'y', slug, `${path}.anchorGround.y`)
  const metersToWidth = readNumber(ground, 'metersToWidth', slug, `${path}.anchorGround.metersToWidth`)
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    fail(slug, `${path}.anchorGround.x e y tienen que estar entre 0 y 1.`)
  }
  if (metersToWidth <= 0) {
    fail(slug, `${path}.anchorGround.metersToWidth debe ser mayor a 0.`)
  }
  return { x, y, metersToWidth }
}

// Modo de visibilidad de precio (SPEC 6.2 y 10). Sin el objeto, o con el objeto y sin la
// clave, vale range. En la etapa 1 de D30 estan implementados exact, range y hidden:
// gated e internal se rechazan al cargar en lugar de caer a range, porque un fallback
// silencioso mostraria precio a un cliente que pidio no mostrarlo.
const DISPLAY_IMPLEMENTED: PriceDisplay[] = ['exact', 'range', 'hidden']
const DISPLAY_PENDING: PriceDisplay[] = ['gated', 'internal']
export const DEFAULT_PRICE_DISPLAY: PriceDisplay = 'range'

function readPricing(raw: Raw, slug: string): { display: PriceDisplay } | undefined {
  if (raw.pricing === undefined) {
    return undefined
  }
  const pricing = readObject(raw, 'pricing', slug, 'pricing')
  if (pricing.display === undefined) {
    return undefined
  }
  const display = readString(pricing, 'display', slug, 'pricing.display')
  if (DISPLAY_IMPLEMENTED.includes(display as PriceDisplay)) {
    return { display: display as PriceDisplay }
  }
  if (DISPLAY_PENDING.includes(display as PriceDisplay)) {
    fail(slug, `pricing.display "${display}" todavia no esta implementado: la etapa 1 de SPEC 6.2 sirve exact, range y hidden.`)
  }
  fail(slug, `pricing.display "${display}" no es un modo valido: los modos son exact, range, gated, hidden e internal.`)
}

// Unico lugar que resuelve el default. Lo lee el cotizador una vez y lo baja como prop.
export function priceDisplayOf(config: ClientConfig): PriceDisplay {
  return config.pricing?.display ?? DEFAULT_PRICE_DISPLAY
}

// Id del tipo totem (SPEC 5.1). Un totem sin anclaje de piso quedaria flotando sobre la
// banda de la fachada, que es peor que un error: la config se rechaza al cargar.
export const TOTEM_TYPE_ID = 'totem'

function requireGroundAnchors(photos: ClientPhoto[], options: SignOptions, slug: string): void {
  if (!options.types.some((item) => item.id === TOTEM_TYPE_ID)) {
    return
  }
  for (const photo of photos) {
    if (photo.anchorGround === undefined) {
      fail(slug, `ofrece el tipo totem y la foto "${photo.id}" no tiene anchorGround.`)
    }
  }
}

// Fotos de fondo del preview (SPEC 10, version 1.9). La primera de la lista es la que
// se muestra al cargar, asi que el orden del JSON importa.
function readPhotos(raw: Raw, slug: string): ClientPhoto[] {
  const rawList = readArray(raw, 'photos', slug, 'photos')
  requireNotEmpty(rawList, slug, 'photos')
  const photos = rawList.map((item, index): ClientPhoto => {
    const path = `photos[${String(index)}]`
    const entry = readEntry(item, slug, path)
    const anchor = readObject(entry, 'anchor', slug, `${path}.anchor`)
    const light = readObject(entry, 'light', slug, `${path}.light`)
    const x = readNumber(anchor, 'x', slug, `${path}.anchor.x`)
    const y = readNumber(anchor, 'y', slug, `${path}.anchor.y`)
    const metersToWidth = readNumber(anchor, 'metersToWidth', slug, `${path}.anchor.metersToWidth`)
    // Fuera de [0, 1] el cartel cae afuera de la foto y el preview queda vacio.
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      fail(slug, `${path}.anchor.x e y tienen que estar entre 0 y 1.`)
    }
    if (metersToWidth <= 0) {
      fail(slug, `${path}.anchor.metersToWidth debe ser mayor a 0.`)
    }
    const fovDeg = readNumber(anchor, 'fovDeg', slug, `${path}.anchor.fovDeg`)
    if (fovDeg <= 0 || fovDeg >= 180) {
      fail(slug, `${path}.anchor.fovDeg tiene que ser mayor a 0 y menor a 180.`)
    }
    const anchorGround = readGroundAnchor(entry, slug, path)
    return {
      id: readString(entry, 'id', slug, `${path}.id`),
      label: readString(entry, 'label', slug, `${path}.label`),
      src: readString(entry, 'src', slug, `${path}.src`),
      ...(anchorGround === undefined ? {} : { anchorGround }),
      anchor: {
        x,
        y,
        metersToWidth,
        cameraYawDeg: readNumber(anchor, 'cameraYawDeg', slug, `${path}.anchor.cameraYawDeg`),
        cameraPitchDeg: readNumber(anchor, 'cameraPitchDeg', slug, `${path}.anchor.cameraPitchDeg`),
        fovDeg,
      },
      light: {
        ambient: readNumber(light, 'ambient', slug, `${path}.light.ambient`),
        keyIntensity: readNumber(light, 'keyIntensity', slug, `${path}.light.keyIntensity`),
        keyAzimuthDeg: readNumber(light, 'keyAzimuthDeg', slug, `${path}.light.keyAzimuthDeg`),
        keyElevationDeg: readNumber(light, 'keyElevationDeg', slug, `${path}.light.keyElevationDeg`),
      },
    }
  })
  requireUniqueIds(
    photos.map((item) => item.id),
    slug,
    'photos',
  )
  return photos
}

function readText(texts: Raw, key: keyof ClientTexts, slug: string): string {
  const value = texts[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `falta la clave de texto "${key}" o no es un string no vacio.`)
  }
  return value
}

// Las dos plantillas sin precio del modo hidden (SPEC 10). Son las unicas claves de texto
// opcionales, y por eso no entran a las 47 requeridas.
const HIDDEN_TEMPLATE_KEYS = ['whatsappMessageHidden', 'whatsappMessageHiddenLetters'] as const

function readOptionalText(texts: Raw, key: keyof ClientTexts, slug: string): string | undefined {
  const value = texts[key]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `la clave de texto "${key}" no es un string no vacio.`)
  }
  return value
}

// Las claves de SPEC seccion 10, una por una. El tipo ClientTexts obliga a que esten todas.
function readTexts(raw: Raw, slug: string): ClientTexts {
  const texts = readObject(raw, 'texts', slug, 'texts')
  return {
    headline: readText(texts, 'headline', slug),
    subheadline: readText(texts, 'subheadline', slug),
    configureTitle: readText(texts, 'configureTitle', slug),
    typeLabel: readText(texts, 'typeLabel', slug),
    widthLabel: readText(texts, 'widthLabel', slug),
    heightLabel: readText(texts, 'heightLabel', slug),
    materialLabel: readText(texts, 'materialLabel', slug),
    lightingLabel: readText(texts, 'lightingLabel', slug),
    installationLabel: readText(texts, 'installationLabel', slug),
    installationYes: readText(texts, 'installationYes', slug),
    installationNo: readText(texts, 'installationNo', slug),
    quantityLabel: readText(texts, 'quantityLabel', slug),
    signTextLabel: readText(texts, 'signTextLabel', slug),
    letterHeightLabel: readText(texts, 'letterHeightLabel', slug),
    depthLabel: readText(texts, 'depthLabel', slug),
    previewZoomLabel: readText(texts, 'previewZoomLabel', slug),
    viewSignOnly: readText(texts, 'viewSignOnly', slug),
    loadingLabel: readText(texts, 'loadingLabel', slug),
    priceLabel: readText(texts, 'priceLabel', slug),
    priceRangeNote: readText(texts, 'priceRangeNote', slug),
    disclaimer: readText(texts, 'disclaimer', slug),
    ctaWhatsapp: readText(texts, 'ctaWhatsapp', slug),
    ctaForm: readText(texts, 'ctaForm', slug),
    formTitle: readText(texts, 'formTitle', slug),
    formName: readText(texts, 'formName', slug),
    formContact: readText(texts, 'formContact', slug),
    formNote: readText(texts, 'formNote', slug),
    formSubmit: readText(texts, 'formSubmit', slug),
    formSending: readText(texts, 'formSending', slug),
    thanksTitle: readText(texts, 'thanksTitle', slug),
    thanksBody: readText(texts, 'thanksBody', slug),
    viewQuote: readText(texts, 'viewQuote', slug),
    quoteTitle: readText(texts, 'quoteTitle', slug),
    quoteValidity: readText(texts, 'quoteValidity', slug),
    quoteDateLabel: readText(texts, 'quoteDateLabel', slug),
    quoteSelectionTitle: readText(texts, 'quoteSelectionTitle', slug),
    quoteBreakdownTitle: readText(texts, 'quoteBreakdownTitle', slug),
    quotePrint: readText(texts, 'quotePrint', slug),
    quoteBack: readText(texts, 'quoteBack', slug),
    lineMaterial: readText(texts, 'lineMaterial', slug),
    lineLighting: readText(texts, 'lineLighting', slug),
    lineType: readText(texts, 'lineType', slug),
    lineInstallation: readText(texts, 'lineInstallation', slug),
    lineDiscount: readText(texts, 'lineDiscount', slug),
    poweredBy: readText(texts, 'poweredBy', slug),
    whatsappMessage: readText(texts, 'whatsappMessage', slug),
    whatsappMessageLetters: readText(texts, 'whatsappMessageLetters', slug),
    // Spread condicional y no la clave en undefined: un cliente que no usa hidden tiene
    // exactamente las 47 claves de SPEC 10, y Object.keys(texts) lo sigue diciendo.
    ...optionalTexts(texts, slug),
  }
}

function optionalTexts(texts: Raw, slug: string): Partial<ClientTexts> {
  const result: Partial<ClientTexts> = {}
  for (const key of HIDDEN_TEMPLATE_KEYS) {
    const value = readOptionalText(texts, key, slug)
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

// Las dos plantillas sin precio solo hacen falta cuando el modo es hidden y el visitante
// tiene boton de WhatsApp: la plantilla con precio dejaria {min} y {max} sin resolver, y un
// mensaje con huecos es lo primero que lee el prospecto. Mismo patron condicional que
// anchorGround con el tipo totem.
function requireHiddenTemplates(
  pricing: { display: PriceDisplay } | undefined,
  cta: CtaMode,
  texts: ClientTexts,
  slug: string,
): void {
  if (pricing?.display !== 'hidden' || cta === 'form') {
    return
  }
  for (const key of HIDDEN_TEMPLATE_KEYS) {
    if (texts[key] === undefined) {
      fail(slug, `usa pricing.display "hidden" con cta "${cta}" y le falta la clave de texto "${key}".`)
    }
  }
}

export function validateClientConfig(raw: unknown): ClientConfig {
  if (!isObject(raw)) {
    fail('(sin slug)', 'la configuracion no es un objeto.')
  }
  const slug = typeof raw.slug === 'string' && raw.slug.length > 0 ? raw.slug : '(sin slug)'
  if (slug === '(sin slug)') {
    fail(slug, 'falta slug o no es un string no vacio.')
  }

  const currency = readObject(raw, 'currency', slug, 'currency')
  const units = readObject(raw, 'units', slug, 'units')
  const brand = readObject(raw, 'brand', slug, 'brand')
  const colors = readObject(brand, 'colors', slug, 'brand.colors')

  const cta = readString(raw, 'cta', slug, 'cta')
  if (!isCtaMode(cta)) {
    fail(slug, `cta tiene un valor invalido: "${cta}".`)
  }

  const decimals = readNumber(currency, 'decimals', slug, 'currency.decimals')
  if (!Number.isInteger(decimals) || decimals < 0) {
    fail(slug, 'currency.decimals debe ser un entero mayor o igual a 0.')
  }

  const photos = readPhotos(raw, slug)
  const options = readOptions(raw, slug)
  requireGroundAnchors(photos, options, slug)

  const pricing = readPricing(raw, slug)
  const texts = readTexts(raw, slug)
  requireHiddenTemplates(pricing, cta, texts, slug)

  return {
    slug,
    locale: readString(raw, 'locale', slug, 'locale'),
    vertical: readString(raw, 'vertical', slug, 'vertical'),
    currency: {
      code: readString(currency, 'code', slug, 'currency.code'),
      symbol: readString(currency, 'symbol', slug, 'currency.symbol'),
      decimals,
    },
    units: {
      length: readString(units, 'length', slug, 'units.length'),
      area: readString(units, 'area', slug, 'units.area'),
    },
    brand: {
      name: readString(brand, 'name', slug, 'brand.name'),
      logo: readString(brand, 'logo', slug, 'brand.logo'),
      colors: {
        bg: readString(colors, 'bg', slug, 'brand.colors.bg'),
        primary: readString(colors, 'primary', slug, 'brand.colors.primary'),
        accent: readString(colors, 'accent', slug, 'brand.colors.accent'),
        text: readString(colors, 'text', slug, 'brand.colors.text'),
        muted: readString(colors, 'muted', slug, 'brand.colors.muted'),
      },
      phone: readString(brand, 'phone', slug, 'brand.phone'),
      whatsapp: readString(brand, 'whatsapp', slug, 'brand.whatsapp'),
      email: readString(brand, 'email', slug, 'brand.email'),
    },
    cta,
    poweredBy: readBoolean(raw, 'poweredBy', slug, 'poweredBy'),
    prices_placeholder: readBoolean(raw, 'prices_placeholder', slug, 'prices_placeholder'),
    // Solo va la clave si el JSON la trae: sin ella priceDisplayOf sirve el default.
    ...(pricing === undefined ? {} : { pricing }),
    photos,
    options,
    texts,
  }
}

// Puente entre el JSON de cliente y el motor de precios.
export function priceRulesFromClient(config: ClientConfig): PriceRules {
  return {
    currency: {
      code: config.currency.code,
      symbol: config.currency.symbol,
      decimals: config.currency.decimals,
    },
    types: config.options.types.map((item) => ({
      id: item.id,
      label: item.label,
      priceFixed: item.priceFixed,
      pricing: item.pricing,
    })),
    materials: config.options.materials.map((item) => ({
      id: item.id,
      label: item.label,
      pricePerArea: item.pricePerArea,
      pricePerLetterHeight: item.pricePerLetterHeight,
    })),
    lighting: config.options.lighting.map((item) => ({
      id: item.id,
      label: item.label,
      pricePerArea: item.pricePerArea,
      pricePerLetter: item.pricePerLetter,
    })),
    depths: config.options.depths.map((item) => ({
      id: item.id,
      label: item.label,
      factor: item.factor,
    })),
    installation: {
      fixed: config.options.installation.fixed,
      perArea: config.options.installation.perArea,
      perLetter: config.options.installation.perLetter,
    },
    discounts: config.options.discounts.map((item) => ({ minQty: item.minQty, pct: item.pct })),
    rangePct: config.options.rangePct,
  }
}

// Modo de precio de un tipo del cliente. Lo usan la vertical y la hoja para saber que
// controles y que claves corresponden; el motor lo vuelve a leer de sus reglas.
export function pricingModeOf(options: SignOptions, typeId: string): PricingMode {
  const found = options.types.find((item) => item.id === typeId)
  if (found === undefined) {
    throw new Error(`pricingModeOf: tipo de cartel invalido: "${typeId}"`)
  }
  return found.pricing
}

// Materiales que se ofrecen en un modo: en letters, solo los que tienen pricePerLetterHeight.
export function materialsForMode(options: SignOptions, mode: PricingMode): MaterialOption[] {
  return mode === 'letters'
    ? options.materials.filter((item) => item.pricePerLetterHeight !== undefined)
    : options.materials
}

export function defaultSelection(config: ClientConfig): SignSelection {
  const { options } = config
  const type = options.types[0]
  return {
    type: type.id,
    text: options.signText.default,
    width: options.width.default,
    height: options.height.default,
    letterHeight: options.letterHeight.default,
    depthId: options.depths[0].id,
    materialId: materialsForMode(options, type.pricing)[0].id,
    lightingId: config.options.lighting[0].id,
    installation: false,
    quantity: config.options.quantity.default,
  }
}
