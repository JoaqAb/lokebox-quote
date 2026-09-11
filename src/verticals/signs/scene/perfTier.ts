// Presupuesto de rendimiento de SPEC 12. Puro, sin React.
// Se mide, no se adivina por user agent.

export type PerfTier = 0 | 1 | 2

export const PERF: {
  warmupMs: number
  windowMs: number
  minFps: number
  dpr: Record<PerfTier, [number, number]>
} = {
  warmupMs: 1000,
  windowMs: 2000,
  minFps: 45,
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
