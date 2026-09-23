// Halo de letras (SPEC 12, version 2.7, D86): decrece desde la tinta y no desde la caja de la
// palabra. Con la caja, todo el rectangulo de la palabra quedaba en el pico y se leia como placa.
// Datos puros, sin React ni three: se rasteriza el contorno de las letras en una grilla en unidades
// de alto de mayuscula, se mide la distancia de cada celda a la tinta y el alpha sale del perfil
// sobre esa distancia. SignBoard lo convierte en textura y lo dibuja en un plano detras de las
// letras. La grilla va en alto de mayuscula 1: el alto de letra es la escala del plano, asi mover
// el slider no regenera nada; solo cambiar el texto.

// Celdas por alto de mayuscula. Con letras de 20 a 40 px en vista, una celda mide 1 a 2 px y el
// filtrado lineal de la textura la suaviza.
export const LETTER_HALO_RESOLUTION = 24

// Perfil del halo de letras sobre t, de 0 en la tinta a 1 en el borde de la banda: (1 - t) al
// cuadrado. Decrece desde la tinta sin meseta y llega a 0 con derivada 0 en el borde.
export function letterHaloProfile(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return (1 - x) * (1 - x)
}

export type Polygon = [number, number][]

export type LetterHaloGrid = {
  width: number
  height: number
  // Esquina inferior izquierda de la grilla y lado de una celda, en alto de mayuscula.
  originX: number
  originY: number
  cell: number
  // Un valor por celda, de abajo hacia arriba y de izquierda a derecha.
  alpha: Float32Array
}

// Relleno par e impar de los poligonos (contornos y huecos juntos) en el centro de cada celda.
export function rasterize(polygons: Polygon[], width: number, height: number, originX: number, originY: number, cell: number): Uint8Array {
  const mask = new Uint8Array(width * height)
  for (let row = 0; row < height; row += 1) {
    const y = originY + (row + 0.5) * cell
    const crossings: number[] = []
    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length; i += 1) {
        const [x0, y0] = polygon[i]
        const [x1, y1] = polygon[(i + 1) % polygon.length]
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          crossings.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0))
        }
      }
    }
    crossings.sort((a, b) => a - b)
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] - originX) / cell - 0.5))
      const to = Math.min(width - 1, Math.floor((crossings[k + 1] - originX) / cell - 0.5))
      for (let col = from; col <= to; col += 1) {
        mask[row * width + col] = 1
      }
    }
  }
  return mask
}

const FAR = 1e20

// Transformada de distancia exacta de una dimension (Felzenszwalb y Huttenlocher), sobre el
// cuadrado de la distancia.
function distance1d(f: Float64Array, n: number): Float64Array {
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  let k = 0
  v[0] = 0
  z[0] = -FAR
  z[1] = FAR
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k -= 1
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k += 1
    v[k] = q
    z[k] = s
    z[k + 1] = FAR
  }
  k = 0
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) {
      k += 1
    }
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
  return d
}

// Distancia de cada celda a la celda de tinta mas cercana, en celdas. 0 sobre la tinta.
export function distanceToInk(mask: Uint8Array, width: number, height: number): Float32Array {
  const squared = new Float64Array(width * height)
  const column = new Float64Array(height)
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      column[y] = mask[y * width + x] === 1 ? 0 : FAR
    }
    const d = distance1d(column, height)
    for (let y = 0; y < height; y += 1) {
      squared[y * width + x] = d[y]
    }
  }
  const row = new Float64Array(width)
  const result = new Float32Array(width * height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      row[x] = squared[y * width + x]
    }
    const d = distance1d(row, width)
    for (let x = 0; x < width; x += 1) {
      result[y * width + x] = Math.sqrt(d[x])
    }
  }
  return result
}

// La grilla del halo para un texto: los contornos de sus letras ya ubicados, en alto de mayuscula,
// y la banda en fraccion del alto de mayuscula. La grilla cubre la tinta mas la banda por lado. La
// tinta queda con alpha 1: debajo de la letra no se ve, y entre trazos muy juntos no hace hueco.
export function letterHaloGrid(polygons: Polygon[], band: number, resolution: number = LETTER_HALO_RESOLUTION): LetterHaloGrid {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const polygon of polygons) {
    for (const [x, y] of polygon) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  const cell = 1 / resolution
  if (minX === Infinity) {
    return { width: 1, height: 1, originX: 0, originY: 0, cell, alpha: new Float32Array(1) }
  }
  // Dos celdas de mas por lado, asi el borde de la textura queda en 0.
  const margin = band + 2 * cell
  const originX = minX - margin
  const originY = minY - margin
  const width = Math.ceil((maxX - minX + 2 * margin) / cell)
  const height = Math.ceil((maxY - minY + 2 * margin) / cell)
  const mask = rasterize(polygons, width, height, originX, originY, cell)
  const distance = distanceToInk(mask, width, height)
  const bandCells = band / cell
  const alpha = new Float32Array(width * height)
  // La distancia va de centro a centro de celda: media celda menos la lleva al borde de la tinta.
  for (let i = 0; i < alpha.length; i += 1) {
    alpha[i] = letterHaloProfile(Math.max(0, distance[i] - 0.5) / bandCells)
  }
  return { width, height, originX, originY, cell, alpha }
}
