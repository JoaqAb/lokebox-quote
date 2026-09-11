import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { SignSelection } from '../../core/types'
import { SignPreviewFallback } from './SignPreviewFallback'
import { SignScene } from './scene/SignScene'
import { PERF, type PerfTier } from './scene/perfTier'
import { scenePalette, signPlacement } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import type { SignVisual } from './visuals'

// Host del preview. Mantiene el marco del layout y adentro pone el canvas.
// No recibe ClientConfig y no busca nada por id: todo lo que necesita dibujar viene
// en selection y visual. prefers-reduced-motion se lee aca, fuera del canvas, y baja
// como prop: adentro del canvas no entra Framer Motion.

type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
}

export function SignPreview({ selection, visual, theme }: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  // El nivel de rendimiento vive aca porque el dpr es un prop del Canvas. Cambia dos
  // veces como maximo en toda la vida del canvas, asi que el re-render no cuesta nada.
  const [tier, setTier] = useState<PerfTier>(0)
  const palette = useMemo(() => scenePalette(theme), [theme])
  const placement = signPlacement(selection, visual.lengthToMeters)

  if (!hasWebGL()) {
    return <SignPreviewFallback selection={selection} theme={theme} />
  }

  return (
    <div
      style={theme}
      className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--q-bg)]"
    >
      <Canvas dpr={PERF.dpr[tier]} gl={{ antialias: true }}>
        <SignScene
          placement={placement}
          material={visual.material}
          lightingMode={visual.lighting.mode}
          palette={palette}
          reducedMotion={reducedMotion}
          tier={tier}
          onTierChange={setTier}
        />
      </Canvas>
    </div>
  )
}
