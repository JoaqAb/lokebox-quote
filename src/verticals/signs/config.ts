import {
  fail,
  readArray,
  readEntry,
  readMaterialVisual,
  readNumber,
  readObject,
  readOptionalPrice,
  readOptionalText,
  readQuantity,
  readRange,
  readString,
  readText,
  requireNotEmpty,
  requireUniqueIds,
  type Raw,
} from '../../core/clientConfig'
import type { DiscountTier, PriceDisplay, CtaMode } from '../../core/types'
import type { VerticalContext } from '../../core/vertical'
import type {
  ClientPhoto,
  DepthOption,
  LightingMode,
  LightingOption,
  MaterialOption,
  Mount,
  PhotoGroundAnchor,
  PriceRules,
  PricingMode,
  SignOptions,
  SignSelection,
  SignTextConfig,
  SignTexts,
  SignTypeOption,
  SignsConfig,
  UnitsConfig,
} from './types'

// Validacion de la parte del JSON de cliente que es de carteles (SPEC 4.4 y 10, D133, D135 y
// D136): units, photos, options, sus 20 claves de texts y las dos plantillas condicionales de
// hidden. Hasta la version 2.12 vivia en src/core/clientConfig.ts; los mensajes de error no
// cambian y salen con las primitivas de lectura del core.

function isPricingMode(value: string): value is PricingMode {
  return value === 'area' || value === 'letters'
}

function isMount(value: string): value is Mount {
  return value === 'flush' || value === 'standoff'
}

function isLightingMode(value: string): value is LightingMode {
  return value === 'none' || value === 'front' || value === 'back'
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
    const id = readString(raw, 'id', slug, `${path}.id`)
    const priceFixed = readNumber(raw, 'priceFixed', slug, `${path}.priceFixed`)
    // Desde la version 2.13 (TAREA_032): el recargo es la linea de tipo, que entra al desglose solo
    // cuando suma (SPEC 6.1), y composePrice suma solo las lineas que recibe (SPEC 6.3). Un recargo
    // negativo restaria sin linea, que el contrato no expresa: se rechaza al cargar.
    if (priceFixed < 0) {
      fail(slug, `${path}.priceFixed no puede ser negativo.`)
    }
    const base = {
      id,
      label: readString(raw, 'label', slug, `${path}.label`),
      priceFixed,
      pricing,
    }
    // mount (version 2.4, D68): obligatorio en los tipos de area; letters no monta un panel.
    if (pricing !== 'area') {
      return base
    }
    if (raw.visual === undefined) {
      fail(slug, `el tipo "${id}" es de area y le falta ${path}.visual.mount.`)
    }
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const mount = readString(visual, 'mount', slug, `${path}.visual.mount`)
    if (!isMount(mount)) {
      fail(slug, `el tipo "${id}" tiene ${path}.visual.mount invalido: "${mount}". Los valores son flush y standoff.`)
    }
    return { ...base, visual: { mount } }
  })
  requireUniqueIds(
    types.map((item) => item.id),
    slug,
    'options.types',
  )
  return types
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
  const wallY = readNumber(ground, 'wallY', slug, `${path}.anchorGround.wallY`)
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    fail(slug, `${path}.anchorGround.x e y tienen que estar entre 0 y 1.`)
  }
  if (metersToWidth <= 0) {
    fail(slug, `${path}.anchorGround.metersToWidth debe ser mayor a 0.`)
  }
  // wallY (version 2.7, D85): la linea de fachada esta por encima del apoyo, en la foto.
  if (wallY < 0 || wallY > 1 || wallY >= y) {
    fail(slug, `${path}.anchorGround.wallY tiene que estar entre 0 y 1 y por encima de anchorGround.y.`)
  }
  return { x, y, metersToWidth, wallY }
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


// Puente entre el JSON de cliente y el motor de precios.
export function priceRulesFromClient(config: SignsConfig): PriceRules {
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


export function defaultSelection(config: SignsConfig): SignSelection {
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

// Las 20 claves de texts de carteles (SPEC 10, D135), en el orden de la lista de SPEC.
export const SIGN_TEXT_KEYS = [
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
] as const satisfies readonly (keyof SignTexts)[]

// Las dos plantillas sin precio del modo hidden (SPEC 10). Son las unicas claves de texto
// opcionales, y por eso no entran a las 20 requeridas.
export const HIDDEN_TEMPLATE_KEYS = ['whatsappMessageHidden', 'whatsappMessageHiddenLetters'] as const

// Las 20 claves, una por una, y las dos plantillas sin precio si el JSON las trae. Spread
// condicional y no la clave en undefined: un cliente que no usa hidden no las tiene.
function readSignTexts(raw: Raw, slug: string): SignTexts {
  const texts = readObject(raw, 'texts', slug, 'texts')
  const required = Object.fromEntries(SIGN_TEXT_KEYS.map((key) => [key, readText(texts, key, slug)]))
  const optional: Partial<SignTexts> = {}
  for (const key of HIDDEN_TEMPLATE_KEYS) {
    const value = readOptionalText(texts, key, slug)
    if (value !== undefined) {
      optional[key] = value
    }
  }
  return { ...required, ...optional } as SignTexts
}

// Las dos plantillas sin precio solo hacen falta cuando el modo es hidden y el visitante
// tiene boton de WhatsApp: la plantilla con precio dejaria {min} y {max} sin resolver, y un
// mensaje con huecos es lo primero que lee el prospecto. Mismo patron condicional que
// anchorGround con el tipo totem.
function requireHiddenTemplates(display: PriceDisplay, cta: CtaMode, texts: SignTexts, slug: string): void {
  if (display !== 'hidden' || cta === 'form') {
    return
  }
  for (const key of HIDDEN_TEMPLATE_KEYS) {
    if (texts[key] === undefined) {
      fail(slug, `usa pricing.display "hidden" con cta "${cta}" y le falta la clave de texto "${key}".`)
    }
  }
}

function readUnits(raw: Raw, slug: string): UnitsConfig {
  const units = readObject(raw, 'units', slug, 'units')
  return {
    length: readString(units, 'length', slug, 'units.length'),
    area: readString(units, 'area', slug, 'units.area'),
  }
}

// validate del contrato (SPEC 4.4): todo lo que no es del core, con las reglas condicionales que
// dependen de lo que el core ya valido.
export function validateSigns(raw: Raw, ctx: VerticalContext): SignsConfig {
  const { slug } = ctx
  const units = readUnits(raw, slug)
  const photos = readPhotos(raw, slug)
  const options = readOptions(raw, slug)
  requireGroundAnchors(photos, options, slug)
  const texts = readSignTexts(raw, slug)
  requireHiddenTemplates(ctx.display, ctx.cta, texts, slug)
  return {
    slug,
    locale: ctx.locale,
    currency: ctx.currency,
    cta: ctx.cta,
    display: ctx.display,
    units,
    photos,
    options,
    texts,
  }
}
