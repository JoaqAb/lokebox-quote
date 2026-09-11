import type {
  ClientConfig,
  ClientTexts,
  CtaMode,
  DiscountTier,
  LightingMode,
  LightingOption,
  MaterialOption,
  PriceRules,
  QuantityConfig,
  RangeConfig,
  SignOptions,
  SignSelection,
  SignTypeOption,
} from './types'

// Validacion de la forma del JSON de cliente en runtime, sin librerias.
// Si algo falta o no cierra, se lanza con un mensaje que dice que falta y en que cliente.
// SPEC seccion 10.

function isCtaMode(value: string): value is CtaMode {
  return value === 'whatsapp' || value === 'form' || value === 'both'
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
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      priceFixed: readNumber(raw, 'priceFixed', slug, `${path}.priceFixed`),
    }
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
      visual: {
        color: readString(visual, 'color', slug, `${path}.visual.color`),
        metalness: readNumber(visual, 'metalness', slug, `${path}.visual.metalness`),
        roughness: readNumber(visual, 'roughness', slug, `${path}.visual.roughness`),
      },
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
  return {
    types: readTypes(options, slug),
    width: readRange(options, 'width', slug, 'options.width'),
    height: readRange(options, 'height', slug, 'options.height'),
    materials: readMaterials(options, slug),
    lighting: readLighting(options, slug),
    installation: {
      fixed: readNumber(installation, 'fixed', slug, 'options.installation.fixed'),
      perArea: readNumber(installation, 'perArea', slug, 'options.installation.perArea'),
    },
    quantity: readQuantity(options, 'quantity', slug, 'options.quantity'),
    discounts: readDiscounts(options, slug),
    rangePct: readNumber(options, 'rangePct', slug, 'options.rangePct'),
  }
}

function readText(texts: Raw, key: keyof ClientTexts, slug: string): string {
  const value = texts[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `falta la clave de texto "${key}" o no es un string no vacio.`)
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
    lineMaterial: readText(texts, 'lineMaterial', slug),
    lineLighting: readText(texts, 'lineLighting', slug),
    lineType: readText(texts, 'lineType', slug),
    lineInstallation: readText(texts, 'lineInstallation', slug),
    lineDiscount: readText(texts, 'lineDiscount', slug),
    poweredBy: readText(texts, 'poweredBy', slug),
    whatsappMessage: readText(texts, 'whatsappMessage', slug),
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
    options: readOptions(raw, slug),
    texts: readTexts(raw, slug),
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
    })),
    materials: config.options.materials.map((item) => ({
      id: item.id,
      label: item.label,
      pricePerArea: item.pricePerArea,
    })),
    lighting: config.options.lighting.map((item) => ({
      id: item.id,
      label: item.label,
      pricePerArea: item.pricePerArea,
    })),
    installation: {
      fixed: config.options.installation.fixed,
      perArea: config.options.installation.perArea,
    },
    discounts: config.options.discounts.map((item) => ({ minQty: item.minQty, pct: item.pct })),
    rangePct: config.options.rangePct,
  }
}

export function defaultSelection(config: ClientConfig): SignSelection {
  return {
    type: config.options.types[0].id,
    width: config.options.width.default,
    height: config.options.height.default,
    materialId: config.options.materials[0].id,
    lightingId: config.options.lighting[0].id,
    installation: false,
    quantity: config.options.quantity.default,
  }
}
