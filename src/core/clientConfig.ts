import type {
  ClientConfig,
  ClientTexts,
  CoreTexts,
  CtaMode,
  MaterialVisual,
  PriceDisplay,
  QuantityConfig,
  RangeConfig,
} from './types'
import type { VerticalContext } from './vertical'
import { FINISHES, isFinish } from './preview/finishMaps'
import { isHexColor } from './theme'

// Validacion de la forma del JSON de cliente en runtime, sin librerias (SPEC 10).
// Si algo falta o no cierra, se lanza con un mensaje que dice que falta y en que cliente.
// Desde la version 2.13 (D133, D135) el core valida su parte: slug, locale, vertical, currency,
// brand, cta, poweredBy, prices_placeholder, pricing y sus 27 claves de texts. Lo demas lo valida
// la vertical con su validate (SPEC 4.4), con las primitivas de lectura que se exportan aca, asi
// el formato de error es uno solo.

function isCtaMode(value: string): value is CtaMode {
  return value === 'whatsapp' || value === 'form' || value === 'both'
}

// Tolerancia para comparar multiplos de step con aritmetica de punto flotante.
const STEP_EPSILON = 1e-6

export type Raw = Readonly<Record<string, unknown>>

export function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function fail(slug: string, message: string): never {
  throw new Error(`Cliente "${slug}": ${message}`)
}

export function readObject(parent: Raw, key: string, slug: string, path: string): Raw {
  const value = parent[key]
  if (!isObject(value)) {
    fail(slug, `falta ${path} o no es un objeto.`)
  }
  return value
}

export function readArray(parent: Raw, key: string, slug: string, path: string): unknown[] {
  const value = parent[key]
  if (!Array.isArray(value)) {
    fail(slug, `falta ${path} o no es una lista.`)
  }
  return value
}

export function readString(parent: Raw, key: string, slug: string, path: string): string {
  const value = parent[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `falta ${path} o no es un string no vacio.`)
  }
  return value
}

export function readNumber(parent: Raw, key: string, slug: string, path: string): number {
  const value = parent[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(slug, `falta ${path} o no es un numero.`)
  }
  return value
}

// Clave opcional: ausente devuelve undefined, presente tiene que ser un numero >= 0.
export function readOptionalPrice(parent: Raw, key: string, slug: string, path: string): number | undefined {
  if (parent[key] === undefined) {
    return undefined
  }
  const value = readNumber(parent, key, slug, path)
  if (value < 0) {
    fail(slug, `${path} no puede ser negativo.`)
  }
  return value
}

export function readBoolean(parent: Raw, key: string, slug: string, path: string): boolean {
  const value = parent[key]
  if (typeof value !== 'boolean') {
    fail(slug, `falta ${path} o no es un booleano.`)
  }
  return value
}

export function readRange(parent: Raw, key: string, slug: string, path: string): RangeConfig {
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

export function readQuantity(parent: Raw, key: string, slug: string, path: string): QuantityConfig {
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

export function requireUniqueIds(ids: string[], slug: string, path: string): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      fail(slug, `${path} tiene el id repetido "${id}".`)
    }
    seen.add(id)
  }
}

export function requireNotEmpty(list: unknown[], slug: string, path: string): void {
  if (list.length === 0) {
    fail(slug, `${path} no puede estar vacio.`)
  }
}

export function readEntry(value: unknown, slug: string, path: string): Raw {
  if (!isObject(value)) {
    fail(slug, `${path} no es un objeto.`)
  }
  return value
}

// Parametro fisico de un material: numero entre 0 y 1 (SPEC 10, version 2.1).
export function readUnit(parent: Raw, key: string, slug: string, path: string): number {
  const value = readNumber(parent, key, slug, path)
  if (value < 0 || value > 1) {
    fail(slug, `${path} vale ${String(value)} y tiene que estar entre 0 y 1.`)
  }
  return value
}

// El material fisico del pipeline del core: finish elige el generador de mapas.
export function readMaterialVisual(visual: Raw, slug: string, path: string): MaterialVisual {
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

// Una clave de texto requerida: string no vacio. La usan el core y las verticales.
export function readText(texts: Raw, key: string, slug: string): string {
  const value = texts[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `falta la clave de texto "${key}" o no es un string no vacio.`)
  }
  return value
}

// Una clave de texto opcional: ausente devuelve undefined, presente tiene que ser no vacia.
export function readOptionalText(texts: Raw, key: string, slug: string): string | undefined {
  const value = texts[key]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string' || value.length === 0) {
    fail(slug, `la clave de texto "${key}" no es un string no vacio.`)
  }
  return value
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

// Lo que el core ya valido y la vertical necesita para sus reglas condicionales (SPEC 4.4).
export function verticalContextOf(config: ClientConfig): VerticalContext {
  return {
    slug: config.slug,
    locale: config.locale,
    currency: config.currency,
    cta: config.cta,
    display: priceDisplayOf(config),
  }
}

// Las 27 claves de texts del core (SPEC 10, D135), en el orden de la lista de SPEC.
export const CORE_TEXT_KEYS = [
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
] as const satisfies readonly (keyof CoreTexts)[]

// Las 27 del core, validadas, y las demas claves de texto del JSON tal cual: las valida la vertical,
// y contra este objeto se resuelven las etiquetas que emite (D135).
function readTexts(raw: Raw, slug: string): ClientTexts {
  const texts = readObject(raw, 'texts', slug, 'texts')
  const rest: Record<string, string> = {}
  for (const [key, value] of Object.entries(texts)) {
    if (typeof value === 'string') {
      rest[key] = value
    }
  }
  const core = Object.fromEntries(CORE_TEXT_KEYS.map((key) => [key, readText(texts, key, slug)])) as CoreTexts
  return { ...rest, ...core }
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
  const brand = readObject(raw, 'brand', slug, 'brand')
  const colors = readObject(brand, 'colors', slug, 'brand.colors')

  const cta = readString(raw, 'cta', slug, 'cta')
  if (!isCtaMode(cta)) {
    fail(slug, `cta tiene un valor invalido: "${cta}".`)
  }

  // El tono del escenario sale del fondo (D132): un fondo que no es #RRGGBB no tiene luminancia
  // y se rechaza al cargar, en lugar de romper el preview.
  const bg = readString(colors, 'bg', slug, 'brand.colors.bg')
  if (!isHexColor(bg)) {
    fail(slug, `brand.colors.bg "${bg}" no es un color #RRGGBB.`)
  }

  const decimals = readNumber(currency, 'decimals', slug, 'currency.decimals')
  if (!Number.isInteger(decimals) || decimals < 0) {
    fail(slug, 'currency.decimals debe ser un entero mayor o igual a 0.')
  }

  const pricing = readPricing(raw, slug)
  const texts = readTexts(raw, slug)

  return {
    slug,
    locale: readString(raw, 'locale', slug, 'locale'),
    vertical: readString(raw, 'vertical', slug, 'vertical'),
    currency: {
      code: readString(currency, 'code', slug, 'currency.code'),
      symbol: readString(currency, 'symbol', slug, 'currency.symbol'),
      decimals,
    },
    brand: {
      name: readString(brand, 'name', slug, 'brand.name'),
      logo: readString(brand, 'logo', slug, 'brand.logo'),
      colors: {
        bg,
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
    texts,
    json: raw,
  }
}
