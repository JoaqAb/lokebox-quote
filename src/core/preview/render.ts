// Ajustes del pipeline de render (SPEC 12, version 2.0), aparte de RenderPipeline para que el
// modulo del componente exporte solo componentes.
// Constantes del producto, no del cliente: en metros de escena y en luminancia lineal.
export const RENDER = {
  ao: {
    // Radio corto: se tiene que leer en el encuentro del cartel con su apoyo y en los cantos,
    // no como un contorno oscuro alrededor de todo el objeto.
    radius: 0.12,
    distanceFalloff: 1,
    intensity: 1.2,
  },
} as const
