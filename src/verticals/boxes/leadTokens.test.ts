import { describe, expect, it } from 'vitest'
import { validateBoxes } from './config'
import { boxesLogic } from './logic'
import { HIDDEN_TEXT, contextOf, rawOf, testConfigOf } from './testing'
import type { BoxSelection } from './types'

const selection: BoxSelection = { style: 'two-piece', length: 12.5, width: 8, height: 4, materialId: 'rigid', printingId: 'full', quantity: 1000 }

describe('WhatsApp, hoja y lead de cajas (SPEC 21.3)', () => {
  it('los 10 placeholders llenos y formateados con el locale', () => {
    const config = testConfigOf('foldline')
    const result = boxesLogic.price(config, selection)
    expect(boxesLogic.whatsappMessage(config, selection, result, 'range')).toBe(
      `Lid and base 12.5 8 4 in Rigid, paper-wrapped Full color, outside 1,000 $${result.min.toLocaleString('en', { minimumFractionDigits: 2 })} $${result.max.toLocaleString('en', { minimumFractionDigits: 2 })}`,
    )
    const sur = testConfigOf('cajasur')
    const surSelection: BoxSelection = { style: 'mailer', length: 30, width: 20, height: 15, materialId: 'kraft', printingId: 'sin', quantity: 1000 }
    const message = boxesLogic.whatsappMessage(sur, surSelection, boxesLogic.price(sur, surSelection), 'range')
    expect(message).toMatch(/^Mailer autoarmable 30 20 15 cm Kraft corrugado Sin impresión 1\.000 \$\s?[\d.]+ \$\s?[\d.]+$/)
  })

  it('en hidden la plantilla sin precio no lleva ninguna cifra de precio', () => {
    const raw = rawOf('foldline') as Record<string, any>
    raw.texts.whatsappMessageHidden = HIDDEN_TEXT
    const config = validateBoxes(raw, contextOf('foldline', { display: 'hidden' }))
    const result = boxesLogic.price(config, selection)
    const message = boxesLogic.whatsappMessage(config, selection, result, 'hidden')
    expect(message).toBe('Lid and base 12.5 8 4 in Rigid, paper-wrapped Full color, outside 1,000')
    expect(message).not.toContain('$')
  })

  it('filas de la hoja, seleccion del lead y leyenda del desglose', () => {
    const config = testConfigOf('cajasur')
    const sur: BoxSelection = { style: 'shipping', length: 30, width: 20.5, height: 15, materialId: 'kraft', printingId: 'un-color', quantity: 1000 }
    expect(boxesLogic.sheetRows(config, sur)).toEqual([
      { label: 'Style', value: 'Caja de envío' },
      { label: 'Inside size', value: '30 x 20,5 x 15 cm' },
      { label: 'Material', value: 'Kraft corrugado' },
      { label: 'Printing', value: '1 color exterior' },
      { label: 'Quantity', value: '1.000' },
    ])
    expect(boxesLogic.leadSelection(config, sur)).toStrictEqual({
      style: 'shipping', length: 30, width: 20.5, height: 15, unit: 'cm', materialId: 'kraft', printingId: 'un-color', quantity: 1000,
    })
    expect(boxesLogic.breakdownCaption(config, boxesLogic.price(config, sur))).toBe('Per box, for 1.000 boxes. Setup is per order.')
    expect(boxesLogic.quantityOf(sur)).toBe(1000)
  })

  it('detalle de material e impresion: area con su unidad por precio; armado y preparacion sin detalle', () => {
    const config = testConfigOf('foldline')
    const result = boxesLogic.price(config, { ...selection, printingId: 'one', quantity: 250 })
    const details = result.lines.map((line) => (line.id === 'discount' ? 'core' : boxesLogic.lineDetail(config, line)))
    // Fondo (12,5 + 8 + 0,25) x 16,25 mas tapa (12,5 + 3,2 + 0,5) x 11,7: 526,7275 pulg2, 3,66 sq ft.
    expect(details).toEqual(['3.66 sq ft x $1.60', '3.66 sq ft x $0.15', null, 'core', null])
  })
})
