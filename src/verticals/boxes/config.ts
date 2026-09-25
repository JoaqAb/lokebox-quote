import {
  fail,
  readArray,
  readBoolean,
  readEntry,
  readMaterialVisual,
  readNumber,
  readObject,
  readOptionalText,
  readRange,
  readString,
  readText,
  requireNotEmpty,
  requireUniqueIds,
  type Raw,
} from '../../core/clientConfig'
import type { VerticalContext } from '../../core/vertical'
import type {
  BlankPiece,
  BoxDefaults,
  BoxMaterial,
  BoxOptions,
  BoxPrinting,
  BoxSelection,
  BoxShape,
  BoxStyle,
  BoxTexts,
  BoxUnits,
  BoxesConfig,
  LinearSide,
  PrintLogo,
  QuantityTier,
} from './types'

// Validacion de la parte del JSON de cliente que es de cajas (SPEC 21.4): units, options, sus 17
// claves de texts y la plantilla sin precio de hidden. Con las primitivas de lectura del core, asi
// el formato de error es uno solo: el slug y la clave.

const SHAPES: readonly BoxShape[] = ['mailer', 'two-piece', 'shipping']
const LOGOS: readonly PrintLogo[] = ['none', 'accent', 'original']
const LID_SHAPE: BoxShape = 'two-piece'

function isShape(value: string): value is BoxShape {
  return (SHAPES as readonly string[]).includes(value)
}

function isLogo(value: string): value is PrintLogo {
  return (LOGOS as readonly string[]).includes(value)
}

// Un precio o un fijo: numero mayor o igual a 0. Uno negativo restaria desde una linea que no
// entra al desglose (el mismo motivo que D138).
function readPrice(parent: Raw, key: string, slug: string, path: string): number {
  const value = readNumber(parent, key, slug, path)
  if (value < 0) {
    fail(slug, `${path} no puede ser negativo.`)
  }
  return value
}

// Unidades (SPEC 21.2): pulgadas con sqft o centimetros con m2. Otra combinacion falla al cargar.
function readUnits(raw: Raw, slug: string): BoxUnits {
  const units = readObject(raw, 'units', slug, 'units')
  const length = readString(units, 'length', slug, 'units.length')
  const area = readString(units, 'area', slug, 'units.area')
  if (length === 'in' && area === 'sqft') {
    return { length, area }
  }
  if (length === 'cm' && area === 'm2') {
    return { length, area }
  }
  fail(slug, `units tiene la combinacion "${length}" con "${area}": las validas son "in" con "sqft" y "cm" con "m2".`)
}

function readSide(piece: Raw, key: string, slug: string, path: string): LinearSide {
  const side = readObject(piece, key, slug, path)
  return {
    l: readNumber(side, 'l', slug, `${path}.l`),
    w: readNumber(side, 'w', slug, `${path}.w`),
    h: readNumber(side, 'h', slug, `${path}.h`),
    add: readNumber(side, 'add', slug, `${path}.add`),
  }
}

function readBlank(style: Raw, slug: string, path: string): BlankPiece[] {
  const list = readArray(style, 'blank', slug, `${path}.blank`)
  requireNotEmpty(list, slug, `${path}.blank`)
  return list.map((item, index) => {
    const piecePath = `${path}.blank[${String(index)}]`
    const piece = readEntry(item, slug, piecePath)
    return { length: readSide(piece, 'length', slug, `${piecePath}.length`), width: readSide(piece, 'width', slug, `${piecePath}.width`) }
  })
}

function readStyles(options: Raw, slug: string): BoxStyle[] {
  const list = readArray(options, 'styles', slug, 'options.styles')
  requireNotEmpty(list, slug, 'options.styles')
  const styles = list.map((item, index): BoxStyle => {
    const path = `options.styles[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const shape = readString(visual, 'shape', slug, `${path}.visual.shape`)
    if (!isShape(shape)) {
      fail(slug, `${path}.visual.shape "${shape}" no es valido: los valores son ${SHAPES.join(', ')}.`)
    }
    const base = {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      assembly: readPrice(raw, 'assembly', slug, `${path}.assembly`),
      blank: readBlank(raw, slug, path),
    }
    if (shape !== LID_SHAPE) {
      return { ...base, visual: { shape } }
    }
    // lidDepth, obligatorio solo en two-piece, entre 0 y 1: el alto de la tapa como fraccion del alto.
    if (visual.lidDepth === undefined) {
      fail(slug, `${path}.visual.lidDepth falta y el estilo es "${LID_SHAPE}".`)
    }
    const lidDepth = readNumber(visual, 'lidDepth', slug, `${path}.visual.lidDepth`)
    if (lidDepth <= 0 || lidDepth > 1) {
      fail(slug, `${path}.visual.lidDepth vale ${String(lidDepth)} y tiene que ser mayor a 0 y a lo sumo 1.`)
    }
    return { ...base, visual: { shape, lidDepth } }
  })
  requireUniqueIds(
    styles.map((item) => item.id),
    slug,
    'options.styles',
  )
  return styles
}

function readMaterials(options: Raw, styles: BoxStyle[], slug: string): BoxMaterial[] {
  const list = readArray(options, 'materials', slug, 'options.materials')
  requireNotEmpty(list, slug, 'options.materials')
  const styleIds = styles.map((item) => item.id)
  const materials = list.map((item, index): BoxMaterial => {
    const path = `options.materials[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const thicknessMm = readNumber(visual, 'thicknessMm', slug, `${path}.visual.thicknessMm`)
    if (thicknessMm <= 0) {
      fail(slug, `${path}.visual.thicknessMm debe ser mayor a 0.`)
    }
    const base = {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      pricePerArea: readPrice(raw, 'pricePerArea', slug, `${path}.pricePerArea`),
      visual: { ...readMaterialVisual(visual, slug, `${path}.visual`), thicknessMm },
    }
    if (raw.styles === undefined) {
      return base
    }
    const allowed = readArray(raw, 'styles', slug, `${path}.styles`)
    requireNotEmpty(allowed, slug, `${path}.styles`)
    const ids = allowed.map((id, position) => {
      if (typeof id !== 'string' || !styleIds.includes(id)) {
        fail(slug, `${path}.styles[${String(position)}] "${String(id)}" no es un estilo de options.styles.`)
      }
      return id
    })
    return { ...base, styles: ids }
  })
  requireUniqueIds(
    materials.map((item) => item.id),
    slug,
    'options.materials',
  )
  // Cada estilo tiene al menos un material (SPEC 21.1).
  for (const style of styles) {
    if (materialsForStyle(materials, style.id).length === 0) {
      fail(slug, `el estilo "${style.id}" no tiene ningun material en options.materials.`)
    }
  }
  return materials
}

function readPrinting(options: Raw, slug: string): BoxPrinting[] {
  const list = readArray(options, 'printing', slug, 'options.printing')
  requireNotEmpty(list, slug, 'options.printing')
  const printing = list.map((item, index): BoxPrinting => {
    const path = `options.printing[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const visual = readObject(raw, 'visual', slug, `${path}.visual`)
    const logo = readString(visual, 'logo', slug, `${path}.visual.logo`)
    if (!isLogo(logo)) {
      fail(slug, `${path}.visual.logo "${logo}" no es valido: los valores son ${LOGOS.join(', ')}.`)
    }
    return {
      id: readString(raw, 'id', slug, `${path}.id`),
      label: readString(raw, 'label', slug, `${path}.label`),
      pricePerArea: readPrice(raw, 'pricePerArea', slug, `${path}.pricePerArea`),
      setup: readPrice(raw, 'setup', slug, `${path}.setup`),
      visual: { logo, inside: readBoolean(visual, 'inside', slug, `${path}.visual.inside`) },
    }
  })
  requireUniqueIds(
    printing.map((item) => item.id),
    slug,
    'options.printing',
  )
  return printing
}

// Escalones (SPEC 21.2, D141): qty entero positivo, qty y pct estrictamente crecientes, y el primer
// pct en 0.
function readQuantities(options: Raw, slug: string): QuantityTier[] {
  const list = readArray(options, 'quantities', slug, 'options.quantities')
  requireNotEmpty(list, slug, 'options.quantities')
  const tiers = list.map((item, index): QuantityTier => {
    const path = `options.quantities[${String(index)}]`
    const raw = readEntry(item, slug, path)
    const qty = readNumber(raw, 'qty', slug, `${path}.qty`)
    if (!Number.isInteger(qty) || qty < 1) {
      fail(slug, `${path}.qty debe ser un entero mayor o igual a 1.`)
    }
    return { qty, pct: readNumber(raw, 'pct', slug, `${path}.pct`) }
  })
  if (tiers[0].pct !== 0) {
    fail(slug, `options.quantities[0].pct vale ${String(tiers[0].pct)} y el primer escalon tiene que ser 0.`)
  }
  for (let index = 1; index < tiers.length; index += 1) {
    if (tiers[index].qty <= tiers[index - 1].qty || tiers[index].pct <= tiers[index - 1].pct) {
      fail(slug, `options.quantities[${String(index)}] no crece: qty y pct tienen que ser estrictamente crecientes.`)
    }
  }
  return tiers
}

// Materiales que valen para un estilo, en el orden del JSON.
export function materialsForStyle(materials: BoxMaterial[], styleId: string): BoxMaterial[] {
  return materials.filter((item) => item.styles === undefined || item.styles.includes(styleId))
}

function readDefaults(options: Raw, parsed: Omit<BoxOptions, 'defaults'>, slug: string): BoxDefaults {
  const raw = readObject(options, 'defaults', slug, 'options.defaults')
  const defaults: BoxDefaults = {
    style: readString(raw, 'style', slug, 'options.defaults.style'),
    materialId: readString(raw, 'materialId', slug, 'options.defaults.materialId'),
    printingId: readString(raw, 'printingId', slug, 'options.defaults.printingId'),
    quantity: readNumber(raw, 'quantity', slug, 'options.defaults.quantity'),
  }
  if (!parsed.styles.some((item) => item.id === defaults.style)) {
    fail(slug, `options.defaults.style "${defaults.style}" no es un estilo de options.styles.`)
  }
  if (!materialsForStyle(parsed.materials, defaults.style).some((item) => item.id === defaults.materialId)) {
    fail(slug, `options.defaults.materialId "${defaults.materialId}" no vale para el estilo "${defaults.style}".`)
  }
  if (!parsed.printing.some((item) => item.id === defaults.printingId)) {
    fail(slug, `options.defaults.printingId "${defaults.printingId}" no es una impresion de options.printing.`)
  }
  if (!parsed.quantities.some((item) => item.qty === defaults.quantity)) {
    fail(slug, `options.defaults.quantity ${String(defaults.quantity)} no es un escalon de options.quantities.`)
  }
  return defaults
}

function readOptions(raw: Raw, slug: string): BoxOptions {
  const options = readObject(raw, 'options', slug, 'options')
  const styles = readStyles(options, slug)
  const parsed = {
    styles,
    length: readRange(options, 'length', slug, 'options.length'),
    width: readRange(options, 'width', slug, 'options.width'),
    height: readRange(options, 'height', slug, 'options.height'),
    materials: readMaterials(options, styles, slug),
    printing: readPrinting(options, slug),
    quantities: readQuantities(options, slug),
    rangePct: readNumber(options, 'rangePct', slug, 'options.rangePct'),
  }
  return { ...parsed, defaults: readDefaults(options, parsed, slug) }
}

// Las 17 claves de texts de cajas (SPEC 21.4), en el orden de la lista de SPEC.
export const BOX_TEXT_KEYS = [
  'styleLabel',
  'dimensionsLabel',
  'lengthLabel',
  'widthLabel',
  'heightLabel',
  'materialLabel',
  'printingLabel',
  'quantityLabel',
  'previewZoomLabel',
  'viewClosed',
  'viewOpen',
  'lineMaterial',
  'linePrinting',
  'lineAssembly',
  'lineSetup',
  'perBoxCaption',
  'whatsappMessage',
] as const satisfies readonly Exclude<keyof BoxTexts, 'whatsappMessageHidden'>[]

export const BOX_HIDDEN_TEMPLATE_KEY = 'whatsappMessageHidden'

// Las 17 claves y la plantilla sin precio, que se exige solo con hidden y un CTA con WhatsApp
// (SPEC 21.3): con la plantilla con precio, {min} y {max} quedarian sin resolver.
function readBoxTexts(raw: Raw, ctx: VerticalContext): BoxTexts {
  const { slug } = ctx
  const texts = readObject(raw, 'texts', slug, 'texts')
  const required = Object.fromEntries(BOX_TEXT_KEYS.map((key) => [key, readText(texts, key, slug)])) as Omit<BoxTexts, 'whatsappMessageHidden'>
  const hidden = readOptionalText(texts, BOX_HIDDEN_TEMPLATE_KEY, slug)
  if (hidden === undefined && ctx.display === 'hidden' && ctx.cta !== 'form') {
    fail(slug, `usa pricing.display "hidden" con cta "${ctx.cta}" y le falta la clave de texto "${BOX_HIDDEN_TEMPLATE_KEY}".`)
  }
  return hidden === undefined ? required : { ...required, whatsappMessageHidden: hidden }
}

// validate del contrato (SPEC 4.4). Un cliente de cajas no lleva photos.
export function validateBoxes(raw: Raw, ctx: VerticalContext): BoxesConfig {
  const { slug } = ctx
  if (raw.photos !== undefined) {
    fail(slug, 'photos no va en un cliente de cajas: el preview es solo el estudio.')
  }
  return {
    slug,
    locale: ctx.locale,
    currency: ctx.currency,
    cta: ctx.cta,
    display: ctx.display,
    units: readUnits(raw, slug),
    options: readOptions(raw, slug),
    texts: readBoxTexts(raw, ctx),
  }
}

// La seleccion inicial: la de defaults, con las medidas en el default de cada range.
export function defaultSelection(config: BoxesConfig): BoxSelection {
  const { options } = config
  return {
    style: options.defaults.style,
    length: options.length.default,
    width: options.width.default,
    height: options.height.default,
    materialId: options.defaults.materialId,
    printingId: options.defaults.printingId,
    quantity: options.defaults.quantity,
  }
}

// Busca por id y lanza con el valor en el mensaje.
export function findById<T extends { id: string }>(list: T[], id: string, what: string): T {
  const found = list.find((item) => item.id === id)
  if (found === undefined) {
    throw new Error(`cajas: ${what} invalido: "${id}"`)
  }
  return found
}
