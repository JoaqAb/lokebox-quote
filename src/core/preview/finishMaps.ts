// Mapas de los acabados (SPEC 12, version 2.1, D52 y D53): roughness y normal generados con
// ruido determinista, nunca descargados. Funcion pura, sin three: devuelve bytes RGBA que
// finishTextures convierte en textura. El acabado lo elige finish del JSON del cliente; los
// generadores son del codigo, y por eso viven en core y no en una vertical.
// Todos los mapas repiten sin costura: el ruido se envuelve en el periodo del mapa, asi la
// cara se puede cubrir con el mapa repetido por metro sin que se vea el borde de cada copia.
// El roughness va en el canal verde, que es el que lee three, y multiplica al roughness del
// JSON: por eso el mapa ronda 1 y solo baja. El normal va en espacio tangente, z hacia afuera.

import type { Finish } from '../types'

export type { Finish }

export const FINISHES: readonly Finish[] = ['foam', 'brushed', 'polished']

// Lado del mapa en texeles. Potencia de dos, para que la textura tenga mipmaps.
export const FINISH_MAP_SIZE = 256

type FinishRecipe = {
  // Cuantos metros de superficie cubre una copia del mapa.
  tileMeters: number
  // Celdas de ruido por lado del mapa, en x y en y, de la octava mas gruesa. Distintas en
  // x y en y dan vetas: el cepillado tiene pocas celdas a lo largo y muchas a lo ancho.
  cells: [number, number]
  octaves: number
  seed: number
  // Pendiente del relieve antes de normalScale del JSON.
  relief: number
  // Cuanto baja el roughness en el punto mas liso del ruido: el mapa va de 1 - roughnessDrop a 1.
  roughnessDrop: number
}

export const FINISH_RECIPES: Record<Finish, FinishRecipe> = {
  // Espuma de PVC: poros finos y parejos en las dos direcciones. Una copia cada 25 cm.
  foam: { tileMeters: 0.25, cells: [48, 48], octaves: 3, seed: 11, relief: 3, roughnessDrop: 0.12 },
  // Chapa cepillada: vetas horizontales largas y finas. Una copia cada 50 cm.
  brushed: { tileMeters: 0.5, cells: [2, 128], octaves: 3, seed: 23, relief: 2, roughnessDrop: 0.3 },
  // Acrilico pulido: casi plano, apenas una variacion suave del brillo. Una copia por metro.
  polished: { tileMeters: 1, cells: [4, 4], octaves: 2, seed: 37, relief: 0.2, roughnessDrop: 0.08 },
}

export type FinishMapData = {
  size: number
  // RGBA, fila por fila, desde v = 0.
  roughness: Uint8Array
  normal: Uint8Array
}

// Hash entero de una celda: mismo resultado en cualquier navegador y en cualquier corrida.
function hashCell(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

// Ruido de valor que se repite cada cellsX por cellsY celdas. u y v en [0, 1).
function periodicNoise(u: number, v: number, cellsX: number, cellsY: number, seed: number): number {
  const x = u * cellsX
  const y = v * cellsY
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const wrap = (value: number, period: number) => ((value % period) + period) % period
  const xa = wrap(x0, cellsX)
  const xb = wrap(x0 + 1, cellsX)
  const ya = wrap(y0, cellsY)
  const yb = wrap(y0 + 1, cellsY)
  const top = hashCell(xa, ya, seed) * (1 - tx) + hashCell(xb, ya, seed) * tx
  const bottom = hashCell(xa, yb, seed) * (1 - tx) + hashCell(xb, yb, seed) * tx
  return top * (1 - ty) + bottom * ty
}

// Alturas del acabado en [0, 1], size por size, fila por fila. Cada octava duplica las celdas
// y conserva el periodo del mapa, asi la suma tambien repite sin costura.
export function finishHeights(finish: Finish, size: number = FINISH_MAP_SIZE): Float32Array {
  const recipe = FINISH_RECIPES[finish]
  const heights = new Float32Array(size * size)
  let total = 0
  for (let octave = 0; octave < recipe.octaves; octave += 1) {
    total += 0.5 ** octave
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 0
      for (let octave = 0; octave < recipe.octaves; octave += 1) {
        const scale = 2 ** octave
        value +=
          periodicNoise(
            x / size,
            y / size,
            recipe.cells[0] * scale,
            recipe.cells[1] * scale,
            recipe.seed + octave,
          ) *
          0.5 ** octave
      }
      heights[y * size + x] = value / total
    }
  }
  return heights
}

function toByte(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}

export function buildFinishMaps(finish: Finish, size: number = FINISH_MAP_SIZE): FinishMapData {
  const recipe = FINISH_RECIPES[finish]
  const heights = finishHeights(finish, size)
  const roughness = new Uint8Array(size * size * 4)
  const normal = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      const h = at(x, y)
      // Lo alto del relieve es lo mas gastado: mas liso. El resto conserva el roughness del JSON.
      const rough = toByte(1 - recipe.roughnessDrop * h)
      roughness[index] = rough
      roughness[index + 1] = rough
      roughness[index + 2] = rough
      roughness[index + 3] = 255
      // Pendiente por diferencias centrales, envolviendo en el borde: el normal tambien repite.
      const dx = (at(x + 1, y) - at(x - 1, y)) * recipe.relief
      const dy = (at(x, y + 1) - at(x, y - 1)) * recipe.relief
      const length = Math.hypot(dx, dy, 1)
      normal[index] = toByte((-dx / length) * 0.5 + 0.5)
      normal[index + 1] = toByte((-dy / length) * 0.5 + 0.5)
      normal[index + 2] = toByte((1 / length) * 0.5 + 0.5)
      normal[index + 3] = 255
    }
  }
  return { size, roughness, normal }
}

export function isFinish(value: string): value is Finish {
  return (FINISHES as readonly string[]).includes(value)
}
