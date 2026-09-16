import { listClientSlugs } from '../clients'
import type { CurrencyConfig } from '../core/types'

// Validacion de la forma del JSON de la landing en runtime, sin librerias (SPEC 13).
// Mismo estilo que core/clientConfig.ts: si algo falta o no cierra, se lanza con un mensaje
// que dice que clave falta. La landing no es un cliente: no entra al registro de clientes.

export type LandingTexts = {
  headline: string
  subheadline: string
  demosTitle: string
  demosNote: string
  howTitle: string
  how: string[]
  forWhoTitle: string
  forWho: string[]
  offerTitle: string
  offerPrice: string
  offerMonthlyTitle: string
  offerMoreTitle: string
  contactTitle: string
  contactBody: string
  contactButton: string
  footer: string
}

export type LandingColors = {
  bg: string
  text: string
  muted: string
  accent: string
}

export type LandingDemo = {
  id: string
  label: string
  href: string
}

// La oferta de SPEC 15: un solo precio piso, lo que incluye el setup, lo que incluye el
// abono y lo que se construye por mas y se cotiza caso por caso. Sin tiers y sin precios
// de add-ons: un precio de add-on que todavia no se midio se convierte en techo.
export type LandingOffer = {
  price: { setup: number; monthly: number }
  setup: string[]
  monthly: string[]
  more: string[]
}

export type LandingConfig = {
  locale: string
  currency: CurrencyConfig
  brand: { name: string; logo: string }
  colors: LandingColors
  texts: LandingTexts
  demos: LandingDemo[]
  offer: LandingOffer
  // true mientras el email no sea el publico: lo completa Canal C. Sin efecto visible.
  contact: { email: string; placeholder: boolean }
}

type Raw = Record<string, unknown>

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const DEMO_HREF = /^\/d\/([^/]+)$/
const EMAIL = /^[^@]+@[^@]+\.[^@]+$/
const ASSET_PATH = /^\/[^\s]+\.[a-z0-9]+$/i
const STEPS_PER_LIST = 3
const DEMO_COUNT = 2
// Huecos de texts.offerPrice: los completa la landing con el formateo de moneda del core.
// No son texto visible, son las marcas donde entra cada numero.
export const PRICE_SLOTS = { setup: '{setup}', monthly: '{monthly}' } as const

const STRING_TEXT_KEYS = [
  'headline',
  'subheadline',
  'demosTitle',
  'demosNote',
  'howTitle',
  'forWhoTitle',
  'offerTitle',
  'offerPrice',
  'offerMonthlyTitle',
  'offerMoreTitle',
  'contactTitle',
  'contactBody',
  'contactButton',
  'footer',
] as const

function fail(message: string): never {
  throw new Error(`Landing: ${message}`)
}

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readObject(parent: Raw, key: string, path: string): Raw {
  const value = parent[key]
  if (!isObject(value)) {
    fail(`falta ${path} o no es un objeto.`)
  }
  return value
}

function readArray(parent: Raw, key: string, path: string): unknown[] {
  const value = parent[key]
  if (!Array.isArray(value)) {
    fail(`falta ${path} o no es una lista.`)
  }
  return value
}

function readString(parent: Raw, key: string, path: string): string {
  const value = parent[key]
  if (typeof value !== 'string' || value.length === 0) {
    fail(`falta ${path} o no es un string no vacio.`)
  }
  return value
}

function readPositive(parent: Raw, key: string, path: string): number {
  const value = parent[key]
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    fail(`falta ${path} o no es un numero mayor que 0.`)
  }
  return value
}

function readStringList(parent: Raw, key: string, path: string): string[] {
  return readArray(parent, key, path).map((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      fail(`${path}[${String(index)}] no es un string no vacio.`)
    }
    return item
  })
}

function readEntries(parent: Raw, key: string, path: string, count: number): Raw[] {
  const list = readArray(parent, key, path)
  if (list.length !== count) {
    fail(`${path} tiene que tener exactamente ${String(count)} entradas y tiene ${String(list.length)}.`)
  }
  const entries = list.map((item, index) => {
    if (!isObject(item)) {
      fail(`${path}[${String(index)}] no es un objeto.`)
    }
    return item
  })
  const ids = entries.map((entry, index) => readString(entry, 'id', `${path}[${String(index)}].id`))
  if (new Set(ids).size !== ids.length) {
    fail(`${path} tiene ids repetidos.`)
  }
  return entries
}

function readCurrency(raw: Raw): CurrencyConfig {
  const currency = readObject(raw, 'currency', 'currency')
  const decimals = currency.decimals
  if (typeof decimals !== 'number' || !Number.isInteger(decimals) || decimals < 0) {
    fail('falta currency.decimals o no es un entero mayor o igual a 0.')
  }
  // display es opcional en CurrencyConfig y sin la clave vale "symbol", que es lo que
  // muestran las dos demos. La landing la trae en "code" porque su precio se lee fuera de
  // contexto y un simbolo solo no dice en que moneda esta.
  const display = currency.display
  if (display !== undefined && display !== 'symbol' && display !== 'code') {
    fail(`currency.display tiene que ser "symbol" o "code" y es "${String(display)}".`)
  }
  return {
    code: readString(currency, 'code', 'currency.code'),
    symbol: readString(currency, 'symbol', 'currency.symbol'),
    decimals,
    ...(display === undefined ? {} : { display }),
  }
}

function readColors(raw: Raw): LandingColors {
  const colors = readObject(raw, 'colors', 'colors')
  const color = (key: keyof LandingColors): string => {
    const value = readString(colors, key, `colors.${key}`)
    if (!HEX_COLOR.test(value)) {
      fail(`colors.${key} tiene que ser un hexadecimal de seis digitos y es "${value}".`)
    }
    return value
  }
  return { bg: color('bg'), text: color('text'), muted: color('muted'), accent: color('accent') }
}

function readTexts(raw: Raw): LandingTexts {
  const texts = readObject(raw, 'texts', 'texts')
  const strings = Object.fromEntries(
    STRING_TEXT_KEYS.map((key) => [key, readString(texts, key, `texts.${key}`)]),
  ) as Record<(typeof STRING_TEXT_KEYS)[number], string>
  const list = (key: 'how' | 'forWho'): string[] => {
    const items = readStringList(texts, key, `texts.${key}`)
    if (items.length !== STEPS_PER_LIST) {
      fail(`texts.${key} tiene que tener ${String(STEPS_PER_LIST)} entradas y tiene ${String(items.length)}.`)
    }
    return items
  }
  for (const slot of Object.values(PRICE_SLOTS)) {
    if (!strings.offerPrice.includes(slot)) {
      fail(`texts.offerPrice tiene que traer el hueco ${slot} y no lo trae.`)
    }
  }
  return { ...strings, how: list('how'), forWho: list('forWho') }
}

// Cada demo apunta a un cliente que existe: un href roto seria el primer click del visitante.
function readDemos(raw: Raw): LandingDemo[] {
  const slugs = listClientSlugs()
  return readEntries(raw, 'demos', 'demos', DEMO_COUNT).map((entry, index) => {
    const path = `demos[${String(index)}]`
    const href = readString(entry, 'href', `${path}.href`)
    const slug = DEMO_HREF.exec(href)?.[1]
    if (slug === undefined) {
      fail(`${path}.href "${href}" tiene que tener la forma /d/<slug>.`)
    }
    if (!slugs.includes(slug)) {
      fail(`${path}.href "${href}" apunta al slug "${slug}", que no es un cliente.`)
    }
    return { id: readString(entry, 'id', `${path}.id`), label: readString(entry, 'label', `${path}.label`), href }
  })
}

function readOffer(raw: Raw): LandingOffer {
  const offer = readObject(raw, 'offer', 'offer')
  const price = readObject(offer, 'price', 'offer.price')
  const list = (key: 'setup' | 'monthly' | 'more'): string[] => {
    const items = readStringList(offer, key, `offer.${key}`)
    if (items.length === 0) {
      fail(`offer.${key} esta vacia.`)
    }
    return items
  }
  return {
    price: {
      setup: readPositive(price, 'setup', 'offer.price.setup'),
      monthly: readPositive(price, 'monthly', 'offer.price.monthly'),
    },
    setup: list('setup'),
    monthly: list('monthly'),
    more: list('more'),
  }
}

// El logo horizontal de Lokebox, servido desde public/. Es la unica marca Lokebox del
// producto: las demos /d/<slug> siguen con el logo de su cliente. Se valida la forma de la
// ruta, no el archivo: si el archivo falta, el navegador lo dice y la pagina sigue viva.
function readLogo(brand: Raw): string {
  const logo = readString(brand, 'logo', 'brand.logo')
  if (!ASSET_PATH.test(logo)) {
    fail(`brand.logo "${logo}" tiene que ser una ruta absoluta de public con extension.`)
  }
  return logo
}

function readContact(raw: Raw): LandingConfig['contact'] {
  const contact = readObject(raw, 'contact', 'contact')
  const email = readString(contact, 'email', 'contact.email')
  if (!EMAIL.test(email)) {
    fail(`contact.email "${email}" no es un email: le falta la arroba o el punto despues de ella.`)
  }
  const placeholder = contact.placeholder
  if (typeof placeholder !== 'boolean') {
    fail('falta contact.placeholder o no es un booleano.')
  }
  return { email, placeholder }
}

export function validateLandingConfig(raw: unknown): LandingConfig {
  if (!isObject(raw)) {
    fail('la configuracion no es un objeto.')
  }
  const brand = readObject(raw, 'brand', 'brand')
  return {
    locale: readString(raw, 'locale', 'locale'),
    currency: readCurrency(raw),
    brand: { name: readString(brand, 'name', 'brand.name'), logo: readLogo(brand) },
    colors: readColors(raw),
    texts: readTexts(raw),
    demos: readDemos(raw),
    offer: readOffer(raw),
    contact: readContact(raw),
  }
}
