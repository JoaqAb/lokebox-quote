import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PERF, nextTier, type PerfTier } from './perfTier'

// Medidor de fps adentro del canvas. Descarta el calentamiento, mide en ventanas y
// avisa cuando hay que bajar de nivel. En el nivel 2 deja de medir: no hay a donde bajar.

export function usePerfTier(tier: PerfTier, onTierChange: (tier: PerfTier) => void): void {
  const frames = useRef(0)
  const elapsedMs = useRef(0)
  const warmedUp = useRef(false)

  useFrame((_state, delta) => {
    if (tier >= 2) {
      return
    }
    const deltaMs = delta * 1000
    elapsedMs.current += deltaMs

    if (!warmedUp.current) {
      if (elapsedMs.current >= PERF.warmupMs) {
        warmedUp.current = true
        elapsedMs.current = 0
        frames.current = 0
      }
      return
    }

    frames.current += 1
    if (elapsedMs.current < PERF.windowMs) {
      return
    }

    const fps = frames.current / (elapsedMs.current / 1000)
    const next = nextTier(tier, fps)
    elapsedMs.current = 0
    frames.current = 0
    if (next !== tier) {
      onTierChange(next)
    }
  })
}
