import { lazy, type ComponentType } from 'react'
import type { PriceResult } from '../core/types'
import type { VerticalLogic, VerticalModule, VerticalViewProps } from '../core/vertical'
import { signsLogic } from '../verticals/signs/logic'

// Registro de verticales (SPEC 4.4, D121). Vive fuera de src/core: mapea el campo vertical del
// JSON a sus dos partes, la logica importada estatica y la vista con React.lazy, asi la hoja de
// cotizacion, que no monta la vista, no descarga three. Una vertical nueva es una entrada mas.

export const SIGNS_VERTICAL = 'signs'

// Una vertical del registro, con su config, su seleccion y su resultado propios borrados: el core
// la usa por el contrato y nunca mira adentro de esos tipos. Se borran en un solo lugar, register.
export type RegisteredVertical = {
  logic: VerticalLogic<unknown, unknown, PriceResult>
  View: ComponentType<VerticalViewProps<unknown, unknown>>
}

function register<C, S, R extends PriceResult>(module: VerticalModule<C, S, R>): RegisteredVertical {
  // La vista recibe siempre la config y la seleccion que produjo la misma logica: el tipo que se
  // borra aca no puede mezclarse con el de otra vertical.
  return module as unknown as RegisteredVertical
}

const VERTICALS: Readonly<Record<string, RegisteredVertical>> = {
  [SIGNS_VERTICAL]: register({
    logic: signsLogic,
    View: lazy(async () => ({ default: (await import('../verticals/signs/view')).SignsView })),
  }),
}

export function verticalOf(id: string): RegisteredVertical | null {
  return Object.hasOwn(VERTICALS, id) ? VERTICALS[id] : null
}
