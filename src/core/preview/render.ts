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
  // Bloom selectivo (version 2.1, D50): sin umbral de luminancia. Brilla lo que la vertical
  // puso en BLOOM_LAYER y nada mas; intensidad y radio dicen cuanto y hasta donde.
  bloom: {
    intensity: 0.9,
    radius: 0.6,
    levels: 6,
  },
  // Tone mapping sobre el canvas transparente (version 2.4, CoverageToneMapping): donde el alpha
  // del resplandor del bloom pasa de glowAlpha el pixel es luz y se mapea como siempre; debajo,
  // es cobertura y se mapea lineal en su alpha. Medio nivel de 8 bits: por debajo no se ve.
  coverage: {
    glowAlpha: 0.002,
  },
} as const

// Capa de three de los emisores (SPEC 12 y 18, version 2.1). La vertical la habilita en las
// mallas que emiten, igual que decide cuales proyectan sombra; el core no sabe cuales son.
// La 0 es la de siempre: una malla en esta capa se sigue dibujando normal.
export const BLOOM_LAYER = 10

