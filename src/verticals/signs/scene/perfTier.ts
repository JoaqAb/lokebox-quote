// Presupuesto de rendimiento de SPEC 12. Puro, sin React.
// Se mide, no se adivina por user agent.
// El umbral queda por debajo de todo techo de vsync habitual (30, 60, 90 y 120 Hz). Con
// 45 fps, una ventana con vsync a 30 Hz fallaba siempre toda medicion y la escena caia
// al nivel 2 a los cinco segundos de cargar, sola (docs/DECISIONES.md, 12/09/2026).
// El calentamiento cubre la compilacion de shaders y la ventana larga diluye un tiron
// aislado, que con 2000 ms alcanzaba para bajar un nivel de forma permanente.

export type PerfTier = 0 | 1 | 2

export const PERF: {
  warmupMs: number
  windowMs: number
  minFps: number
  dpr: Record<PerfTier, [number, number]>
} = {
  warmupMs: 2000,
  windowMs: 3000,
  minFps: 24,
  dpr: { 0: [1, 1.75], 1: [1, 1.25], 2: [1, 1] },
}

// Baja un nivel si no llega al umbral, y nada mas. El descenso es monotono: el nivel
// nunca vuelve a subir, porque un medidor que sube y baja hace parpadear la escena
// entre configuraciones. Del nivel 2 no se baja mas.
export function nextTier(tier: PerfTier, fps: number): PerfTier {
  if (fps >= PERF.minFps) {
    return tier
  }
  if (tier === 0) {
    return 1
  }
  return 2
}
