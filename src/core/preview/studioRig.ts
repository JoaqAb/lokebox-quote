// Entorno de estudio (SPEC 12, version 2.2 y 2.3, D55, D60 y D61): se genera en runtime con
// lightformers y no se descarga nada. Es un rig de contraste, fuentes brillantes y acotadas
// sobre fondo casi negro: eso hace que una superficie pulida se lea como pulida y una mate
// no. Con un entorno parejo el acrilico y el PVC daban el mismo pixel.
// Datos puros, sin React: SceneStudio los dibuja y los tests los miden.
// Angulos en grados alrededor del origen de la escena, con el frente en +z: azimut 0 es el
// frente y crece hacia +x, elevacion 0 es el horizonte. Intensidades en luz lineal.

export type StudioPanel = {
  // Ancho en azimut, centrado en el azimut del modulo.
  widthDeg: number
  fromElevationDeg: number
  toElevationDeg: number
  intensity: number
}

export type StudioSource = {
  position: [number, number, number]
  scale: [number, number]
  intensity: number
}

// Direccion de la fuente especular del modo vista: la key de la foto (D61).
export type StudioHighlight = { azimuthDeg: number; elevationDeg: number }

export const STUDIO_RIG = {
  // Resolucion del cubo del entorno: solo da reflejo, nunca se ve de fondo.
  resolution: 256,
  background: '#050505',
  // Distancia de las fuentes al origen, en metros. El cubo se renderiza desde el origen.
  radius: 6,
  // Un modulo cada 60 grados alrededor del eje vertical (D60), como un estudio con varios
  // softboxes: la separacion entre materiales sigue al girar el cartel y no solo en el cuadro
  // donde arranca la camara.
  azimuthsDeg: [0, 60, 120, 180, 240, 300],
  // Un modulo, pensado para la cara vista desde su azimut. En modo cartel la camara esta 7
  // grados arriba y la cara refleja un cono de unos 22 grados de alto, de 4 arriba a 18 abajo
  // del horizonte. El panel de abajo cubre mas de la mitad de ese cono; el de arriba, mas
  // angosto y mas tenue, deja entre los dos una franja oscura que cruza la cara: ese borde
  // es lo que hace leer al acrilico como pulido. Entre modulos quedan 20 grados oscuros.
  panels: [
    { widthDeg: 40, fromElevationDeg: -18, toElevationDeg: -6, intensity: 4.5 },
    { widthDeg: 24, fromElevationDeg: -3, toElevationDeg: 16, intensity: 2.25 },
  ] satisfies StudioPanel[],
  // Fuente especular del modo vista (D61), en la direccion de la key de la foto: acotada y
  // brillante, para que el acrilico haga un brillo donde esta el sol de esa foto.
  highlight: { sizeDeg: 10, intensity: 20 },
} as const

function direction(azimuthDeg: number, elevationDeg: number, distance: number): [number, number, number] {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  return [distance * Math.sin(az) * Math.cos(el), distance * Math.sin(el), distance * Math.cos(az) * Math.cos(el)]
}

function span(deg: number, distance: number): number {
  return 2 * distance * Math.tan((deg * Math.PI) / 360)
}

// Las fuentes del rig, cada una mirando al origen. Con highlight, suma la fuente especular
// de la foto.
export function studioSources(highlight: StudioHighlight | null): StudioSource[] {
  const r = STUDIO_RIG.radius
  const sources: StudioSource[] = STUDIO_RIG.azimuthsDeg.flatMap((azimuthDeg) =>
    STUDIO_RIG.panels.map((panel): StudioSource => {
      const elevation = (panel.fromElevationDeg + panel.toElevationDeg) / 2
      return {
        position: direction(azimuthDeg, elevation, r),
        scale: [span(panel.widthDeg, r), span(panel.toElevationDeg - panel.fromElevationDeg, r)],
        intensity: panel.intensity,
      }
    }),
  )
  if (highlight !== null) {
    const size = span(STUDIO_RIG.highlight.sizeDeg, r)
    sources.push({
      position: direction(highlight.azimuthDeg, highlight.elevationDeg, r),
      scale: [size, size],
      intensity: STUDIO_RIG.highlight.intensity,
    })
  }
  return sources
}
