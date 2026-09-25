import type { CtaMode, CurrencyConfig, PriceDisplay } from '../../core/types'
import type { VerticalContext } from '../../core/vertical'
import { validateBoxes } from './config'
import type { BoxesConfig } from './types'

// Ayudas de los tests de cajas: la parte de cajas del JSON de foldline y de cajasur con los
// valores de SPEC 21.4, armada aca para que la logica se pruebe contra la SPEC y no contra el
// archivo. finish y normalScale son los finales de D152, los mismos del JSON. Un test de la fase 3
// exige que src/clients/foldline.json y cajasur.json traigan exactamente estas unidades y opciones.
// Solo las importan los tests.

type Raw = Record<string, unknown>

const kraftVisual = {
  color: '#B8895A', finish: 'foam', metalness: 0, roughness: 0.95, specularIntensity: 0.25, clearcoat: 0,
  clearcoatRoughness: 0, anisotropy: 0, normalScale: 0.1, translucency: 0, thicknessMm: 3,
}
const whiteVisual = {
  color: '#ECEAE4', finish: 'foam', metalness: 0, roughness: 0.9, specularIntensity: 0.3, clearcoat: 0,
  clearcoatRoughness: 0, anisotropy: 0, normalScale: 0.1, translucency: 0, thicknessMm: 3,
}
const rigidVisual = {
  color: '#23303D', finish: 'polished', metalness: 0, roughness: 0.55, specularIntensity: 0.5, clearcoat: 0.3,
  clearcoatRoughness: 0.4, anisotropy: 0, normalScale: 0.1, translucency: 0, thicknessMm: 2,
}

const side = (l: number, w: number, h: number, add: number) => ({ l, w, h, add })

// adds: [mailer largo, mailer ancho, fondo de tapa y fondo, tapa de tapa y fondo, envio largo, envio ancho].
function styles(labels: [string, string, string], assembly: [number, number, number], adds: number[]): Raw[] {
  return [
    {
      id: 'mailer', label: labels[0], assembly: assembly[0],
      blank: [{ length: side(1, 0, 4, adds[0]), width: side(0, 2, 3, adds[1]) }],
      visual: { shape: 'mailer' },
    },
    {
      id: 'two-piece', label: labels[1], assembly: assembly[1],
      blank: [
        { length: side(1, 0, 2, adds[2]), width: side(0, 1, 2, adds[2]) },
        { length: side(1, 0, 0.8, adds[3]), width: side(0, 1, 0.8, adds[3]) },
      ],
      visual: { shape: 'two-piece', lidDepth: 0.4 },
    },
    {
      id: 'shipping', label: labels[2], assembly: assembly[2],
      blank: [{ length: side(2, 2, 0, adds[4]), width: side(0, 1, 1, adds[5]) }],
      visual: { shape: 'shipping' },
    },
  ]
}

const TIERS = [{ qty: 50, pct: 0 }, { qty: 100, pct: 10 }, { qty: 250, pct: 20 }, { qty: 500, pct: 28 }, { qty: 1000, pct: 35 }]

export const FOLDLINE_BOXES: Raw = {
  units: { length: 'in', area: 'sqft' },
  options: {
    styles: styles(['Mailer box', 'Lid and base', 'Shipping box'], [0.25, 0.6, 0.1], [1, 1.5, 0.25, 0.5, 1.5, 0.25]),
    length: { min: 4, max: 24, step: 0.5, default: 10 },
    width: { min: 3, max: 18, step: 0.5, default: 8 },
    height: { min: 1, max: 12, step: 0.5, default: 4 },
    materials: [
      { id: 'kraft', label: 'Kraft corrugated', pricePerArea: 0.35, visual: kraftVisual },
      { id: 'white', label: 'White corrugated', pricePerArea: 0.5, visual: whiteVisual },
      { id: 'rigid', label: 'Rigid, paper-wrapped', pricePerArea: 1.6, styles: ['two-piece'], visual: rigidVisual },
    ],
    printing: [
      { id: 'none', label: 'No print', pricePerArea: 0, setup: 0, visual: { logo: 'none', inside: false } },
      { id: 'one', label: '1 color, outside', pricePerArea: 0.15, setup: 60, visual: { logo: 'accent', inside: false } },
      { id: 'full', label: 'Full color, outside', pricePerArea: 0.45, setup: 120, visual: { logo: 'original', inside: false } },
      { id: 'full-inside', label: 'Full color, inside and out', pricePerArea: 0.8, setup: 180, visual: { logo: 'original', inside: true } },
    ],
    quantities: TIERS,
    defaults: { style: 'mailer', materialId: 'kraft', printingId: 'one', quantity: 250 },
    rangePct: 10,
  },
}

export const CAJASUR_BOXES: Raw = {
  units: { length: 'cm', area: 'm2' },
  options: {
    styles: styles(['Mailer autoarmable', 'Tapa y fondo', 'Caja de envío'], [170, 410, 70], [2.5, 4, 0.6, 1.2, 4, 0.6]),
    length: { min: 10, max: 60, step: 1, default: 30 },
    width: { min: 8, max: 45, step: 1, default: 20 },
    height: { min: 3, max: 30, step: 1, default: 15 },
    materials: [
      { id: 'kraft', label: 'Kraft corrugado', pricePerArea: 2500, visual: kraftVisual },
      { id: 'blanco', label: 'Blanco corrugado', pricePerArea: 3600, visual: whiteVisual },
      { id: 'rigido', label: 'Rígido forrado', pricePerArea: 11600, styles: ['two-piece'], visual: rigidVisual },
    ],
    printing: [
      { id: 'sin', label: 'Sin impresión', pricePerArea: 0, setup: 0, visual: { logo: 'none', inside: false } },
      { id: 'un-color', label: '1 color exterior', pricePerArea: 1100, setup: 40000, visual: { logo: 'accent', inside: false } },
      { id: 'full', label: 'Full color exterior', pricePerArea: 3300, setup: 81000, visual: { logo: 'original', inside: false } },
      { id: 'full-interior', label: 'Full color exterior e interior', pricePerArea: 5800, setup: 122000, visual: { logo: 'original', inside: true } },
    ],
    quantities: TIERS,
    defaults: { style: 'shipping', materialId: 'kraft', printingId: 'un-color', quantity: 100 },
    rangePct: 10,
  },
}

// Las 17 claves de texts con valores de prueba. Las de verdad estan en los JSON.
export const TEST_TEXTS: Record<string, string> = {
  styleLabel: 'Style', dimensionsLabel: 'Inside size', lengthLabel: 'Length', widthLabel: 'Width', heightLabel: 'Height',
  materialLabel: 'Material', printingLabel: 'Printing', quantityLabel: 'Quantity', previewZoomLabel: 'Zoom',
  viewClosed: 'Closed', viewOpen: 'Open', lineMaterial: 'Board', linePrinting: 'Printing', lineAssembly: 'Assembly',
  lineSetup: 'Setup', perBoxCaption: 'Per box, for {quantity} boxes. Setup is per order.',
  whatsappMessage: '{style} {length} {width} {height} {unit} {material} {printing} {quantity} {min} {max}',
}

export const HIDDEN_TEXT = '{style} {length} {width} {height} {unit} {material} {printing} {quantity}'

type ContextOptions = { cta?: CtaMode; display?: PriceDisplay }

const USD: CurrencyConfig = { code: 'USD', symbol: '$', decimals: 2 }
const ARS: CurrencyConfig = { code: 'ARS', symbol: '$', decimals: 0 }

export function contextOf(slug: 'foldline' | 'cajasur', options: ContextOptions = {}): VerticalContext {
  const foldline = slug === 'foldline'
  return {
    slug,
    locale: foldline ? 'en' : 'es-AR',
    currency: foldline ? USD : ARS,
    cta: options.cta ?? (foldline ? 'both' : 'whatsapp'),
    display: options.display ?? 'range',
  }
}

export function rawOf(slug: 'foldline' | 'cajasur'): Raw {
  const boxes = slug === 'foldline' ? FOLDLINE_BOXES : CAJASUR_BOXES
  return structuredClone({ vertical: 'boxes', ...boxes, texts: { ...TEST_TEXTS } })
}

export function testConfigOf(slug: 'foldline' | 'cajasur', options: ContextOptions = {}): BoxesConfig {
  return validateBoxes(rawOf(slug), contextOf(slug, options))
}
