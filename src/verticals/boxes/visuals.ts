import { findById } from './config'
import type { BoxMaterialVisual, BoxPrinting, BoxSelection, BoxShape, BoxesConfig } from './types'
import { lengthToMeters, type BoxDims } from './scene/boxGeometry'

// Lo que la escena necesita para dibujar, y nada mas. Puro, sin React: la vista no busca por id.

export type BoxVisual = {
  shape: BoxShape
  dims: BoxDims
  material: BoxMaterialVisual
  printing: BoxPrinting['visual']
}

const MM_PER_METER = 1000

export function resolveBoxVisual(config: BoxesConfig, selection: BoxSelection): BoxVisual {
  const { options } = config
  const style = findById(options.styles, selection.style, 'estilo')
  const material = findById(options.materials, selection.materialId, 'material')
  const printing = findById(options.printing, selection.printingId, 'impresion')
  const factor = lengthToMeters(config.units)
  return {
    shape: style.visual.shape,
    dims: {
      length: selection.length * factor,
      width: selection.width * factor,
      height: selection.height * factor,
      thickness: material.visual.thicknessMm / MM_PER_METER,
      lidDepth: style.visual.lidDepth ?? 0,
    },
    material: material.visual,
    printing: printing.visual,
  }
}
