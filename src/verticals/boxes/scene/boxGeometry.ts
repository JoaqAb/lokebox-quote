import type { FrameVolume, Vec3 } from '../../../core/preview/studioView'
import type { BoxShape, BoxUnits } from '../types'

// Geometria parametrica de la caja (SPEC 21.5). Pura, sin React y sin JSX. En metros: x es el largo,
// y el alto y z el ancho, con el piso en y 0 y la caja centrada en x y z. El frente mira a +z.
// Cada pieza es una plancha del espesor del material, dibujada como caja con cantos redondeados,
// dentro de un grupo que se mueve al abrir: gira sobre su bisagra o se traslada. open va de 0,
// cerrada, a 1, abierta.

// Medidas interiores a metros, con los factores fijos de SPEC 21.5.
const METERS_PER_INCH = 0.0254
const METERS_PER_CM = 0.01

export function lengthToMeters(units: BoxUnits): number {
  return units.length === 'in' ? METERS_PER_INCH : METERS_PER_CM
}

// Radio de los cantos de cada plancha, con tope en fraccion del espesor: un carton de 2 mm no
// admite el radio de uno de 3.
export const BOX_EDGE = { radius: 0.0012, maxRatio: 0.45, segments: 2 } as const

export function edgeRadius(thickness: number): number {
  return Math.min(BOX_EDGE.radius, thickness * BOX_EDGE.maxRatio)
}

// Apertura de cada forma. La tapa del mailer gira sobre la bisagra de atras; las solapas de la caja
// de envio se abren hacia afuera; la tapa de two-piece sube y se apoya al costado, con un hueco.
export const OPEN = {
  mailerLidDeg: 105,
  shippingFlapDeg: 115,
  // Holgura entre la tapa telescopica y el fondo, en fraccion del espesor.
  lidGapRatio: 0.5,
  // Separacion entre el fondo y la tapa apoyada al costado, en fraccion del largo exterior.
  lidAsideRatio: 0.12,
  // Altura extra del arco al pasar la tapa al costado, en fraccion del alto.
  lidLiftRatio: 0.35,
} as const

// Indices de las caras de BoxGeometry: +x, -x, +y, -y, +z, -z.
export const FACE = { px: 0, nx: 1, py: 2, ny: 3, pz: 4, nz: 5 } as const
export type FaceIndex = (typeof FACE)[keyof typeof FACE]

// Una plancha: medida, posicion de su centro dentro del grupo, la cara que mira hacia adentro de la
// caja cuando esta cerrada, y si lleva el logo en su cara exterior.
export type Panel = {
  key: string
  size: Vec3
  offset: Vec3
  inner: FaceIndex
  // La cara exterior que lleva el logo, si la lleva.
  logo?: FaceIndex
}

// Un grupo de planchas que se mueve junto. pivot es su origen en la caja; al abrir gira angle
// grados sobre axis, o se traslada a moveTo.
export type PartGroup = {
  key: string
  pivot: Vec3
  panels: Panel[]
  axis?: 'x' | 'z'
  openAngleDeg?: number
  moveTo?: Vec3
  lift?: number
}

export type BoxRig = {
  groups: PartGroup[]
  // Medida exterior de la caja cerrada: ancho en x, alto en y, profundidad en z.
  outer: Vec3
}

export type BoxDims = { length: number; width: number; height: number; thickness: number; lidDepth: number }

// Fondo y cuatro paredes de alto wall sobre el fondo. Las paredes delantera y trasera cubren el
// largo exterior; las de los costados van entre ellas.
function tray(key: string, lx: number, lz: number, wall: number, t: number, frontLogo: boolean): PartGroup {
  const wallY = t + wall / 2
  const front: Panel = { key: 'front', size: [lx, wall, t], offset: [0, wallY, lz / 2 - t / 2], inner: FACE.nz }
  return {
    key,
    pivot: [0, 0, 0],
    panels: [
      { key: 'bottom', size: [lx, t, lz], offset: [0, t / 2, 0], inner: FACE.py },
      frontLogo ? { ...front, logo: FACE.pz } : front,
      { key: 'back', size: [lx, wall, t], offset: [0, wallY, -lz / 2 + t / 2], inner: FACE.pz },
      { key: 'right', size: [t, wall, lz - 2 * t], offset: [lx / 2 - t / 2, wallY, 0], inner: FACE.nx },
      { key: 'left', size: [t, wall, lz - 2 * t], offset: [-lx / 2 + t / 2, wallY, 0], inner: FACE.px },
    ],
  }
}

function mailer(d: BoxDims): BoxRig {
  const t = d.thickness
  const lx = d.length + 2 * t
  const lz = d.width + 2 * t
  const top = t + d.height
  return {
    outer: [lx, top + t, lz],
    groups: [
      tray('base', lx, lz, d.height, t, false),
      {
        key: 'lid',
        // Bisagra en el canto de arriba de la pared trasera.
        pivot: [0, top, -lz / 2],
        axis: 'x',
        openAngleDeg: -OPEN.mailerLidDeg,
        panels: [{ key: 'lid', size: [lx, t, lz], offset: [0, t / 2, lz / 2], inner: FACE.ny, logo: FACE.py }],
      },
    ],
  }
}

function twoPiece(d: BoxDims): BoxRig {
  const t = d.thickness
  const lx = d.length + 2 * t
  const lz = d.width + 2 * t
  const top = t + d.height
  const gap = t * OPEN.lidGapRatio
  // La tapa telescopica rodea al fondo: su interior es el exterior del fondo mas la holgura.
  const lidX = lx + 2 * (gap + t)
  const lidZ = lz + 2 * (gap + t)
  const skirt = d.lidDepth * d.height
  const lidPanels: Panel[] = [
    { key: 'lid-top', size: [lidX, t, lidZ], offset: [0, skirt + t / 2, 0], inner: FACE.ny, logo: FACE.py },
    { key: 'lid-front', size: [lidX, skirt, t], offset: [0, skirt / 2, lidZ / 2 - t / 2], inner: FACE.nz },
    { key: 'lid-back', size: [lidX, skirt, t], offset: [0, skirt / 2, -lidZ / 2 + t / 2], inner: FACE.pz },
    { key: 'lid-right', size: [t, skirt, lidZ - 2 * t], offset: [lidX / 2 - t / 2, skirt / 2, 0], inner: FACE.nx },
    { key: 'lid-left', size: [t, skirt, lidZ - 2 * t], offset: [-lidX / 2 + t / 2, skirt / 2, 0], inner: FACE.px },
  ]
  // Cerrada, el techo de la tapa apoya sobre las paredes del fondo; abierta, la tapa queda boca
  // arriba en el piso, al costado del fondo.
  const closedY = top - skirt
  const aside = lx / 2 + lx * OPEN.lidAsideRatio + lidX / 2
  return {
    outer: [lidX, top + t, lidZ],
    groups: [
      tray('base', lx, lz, d.height, t, false),
      { key: 'lid', pivot: [0, closedY, 0], moveTo: [aside, 0, 0], lift: d.height * OPEN.lidLiftRatio, panels: lidPanels },
    ],
  }
}

function shipping(d: BoxDims): BoxRig {
  const t = d.thickness
  const lx = d.length + 2 * t
  const lz = d.width + 2 * t
  const top = t + d.height
  // Solapas de la mitad del ancho interior: las largas se tocan en el medio. Las cortas van debajo.
  const depth = d.width / 2
  const short = (side: 1 | -1): PartGroup => ({
    key: side > 0 ? 'flap-right' : 'flap-left',
    pivot: [side * (lx / 2 - t / 2), top, 0],
    axis: 'z',
    openAngleDeg: side * -OPEN.shippingFlapDeg,
    panels: [{ key: 'flap', size: [depth, t, d.width], offset: [-side * (depth / 2 - t / 2), t / 2, 0], inner: FACE.ny }],
  })
  const long = (side: 1 | -1): PartGroup => ({
    key: side > 0 ? 'flap-front' : 'flap-back',
    pivot: [0, top + t, side * (lz / 2 - t / 2)],
    axis: 'x',
    openAngleDeg: side * OPEN.shippingFlapDeg,
    panels: [{ key: 'flap', size: [lx, t, depth], offset: [0, t / 2, -side * (depth / 2 - t / 2)], inner: FACE.ny }],
  })
  return {
    outer: [lx, top + 2 * t, lz],
    groups: [tray('base', lx, lz, d.height, t, true), short(1), short(-1), long(1), long(-1)],
  }
}

export function boxRig(shape: BoxShape, dims: BoxDims): BoxRig {
  if (shape === 'mailer') {
    return mailer(dims)
  }
  if (shape === 'two-piece') {
    return twoPiece(dims)
  }
  return shipping(dims)
}

export type GroupPose = { position: Vec3; rotation: Vec3 }

const DEG = Math.PI / 180

// Pose de un grupo con la apertura open, de 0 a 1. La tapa de two-piece sube en arco mientras se
// corre al costado.
export function groupPose(group: PartGroup, open: number): GroupPose {
  if (group.moveTo !== undefined) {
    const [px, py, pz] = group.pivot
    const [mx, my, mz] = group.moveTo
    const arc = Math.sin(Math.PI * open) * (group.lift ?? 0)
    return {
      position: [px + (mx - px) * open, py + (my - py) * open + arc, pz + (mz - pz) * open],
      rotation: [0, 0, 0],
    }
  }
  const angle = (group.openAngleDeg ?? 0) * DEG * open
  return { position: group.pivot, rotation: group.axis === 'z' ? [0, 0, angle] : group.axis === 'x' ? [angle, 0, 0] : [0, 0, 0] }
}

function rotate(point: Vec3, rotation: Vec3): Vec3 {
  const [x, y, z] = point
  if (rotation[0] !== 0) {
    const c = Math.cos(rotation[0])
    const s = Math.sin(rotation[0])
    return [x, y * c - z * s, y * s + z * c]
  }
  if (rotation[2] !== 0) {
    const c = Math.cos(rotation[2])
    const s = Math.sin(rotation[2])
    return [x * c - y * s, x * s + y * c, z]
  }
  return point
}

// Caja alineada a los ejes que contiene la caja con la apertura open.
export function rigBounds(rig: BoxRig, open: number): { min: Vec3; max: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const group of rig.groups) {
    const pose = groupPose(group, open)
    for (const panel of group.panels) {
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const local: Vec3 = [
              panel.offset[0] + (sx * panel.size[0]) / 2,
              panel.offset[1] + (sy * panel.size[1]) / 2,
              panel.offset[2] + (sz * panel.size[2]) / 2,
            ]
            const turned = rotate(local, pose.rotation)
            for (let i = 0; i < 3; i += 1) {
              const value = turned[i] + pose.position[i]
              min[i] = Math.min(min[i], value)
              max[i] = Math.max(max[i], value)
            }
          }
        }
      }
    }
  }
  return { min, max }
}

// Caja de encuadre (SPEC 21.5): la de la caja cerrada unida a la de la caja abierta, asi incluye la
// tapa o las solapas abiertas y la camara no salta al abrir.
export function frameOf(rig: BoxRig): { volume: FrameVolume; center: Vec3 } {
  const closed = rigBounds(rig, 0)
  const opened = rigBounds(rig, 1)
  const min = closed.min.map((value, i) => Math.min(value, opened.min[i])) as Vec3
  const max = closed.max.map((value, i) => Math.max(value, opened.max[i])) as Vec3
  return {
    volume: { width: max[0] - min[0], height: max[1] - min[1], depth: max[2] - min[2] },
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  }
}

// Logo (SPEC 21.5): centrado en su cara, con un ancho relativo al de la cara y un tope en el alto.
export const LOGO = { widthRatio: 0.62, maxHeightRatio: 0.5, lift: 0.0004 } as const

export function logoSize(face: [number, number], aspect: number): [number, number] {
  const width = Math.min(face[0] * LOGO.widthRatio, face[1] * LOGO.maxHeightRatio * aspect)
  return [width, width / aspect]
}

// Sombra de apoyo en el piso (SPEC 21.5): el degradado del core bajo la huella de la caja.
export const BOX_SHADOW = { scale: 1.5, opacity: 0.3, lift: 0.0005 } as const
