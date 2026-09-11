import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import type { SignSelection } from '../../core/types'
import { SignPreviewFallback } from './SignPreviewFallback'
import { SignScene } from './scene/SignScene'
import { scenePalette, signBoxMeters } from './scene/sceneGeometry'
import { hasWebGL } from './scene/webgl'
import type { SignVisual } from './visuals'

// Host del preview. Mantiene el marco del layout y adentro pone el canvas.
// No recibe ClientConfig y no busca nada por id: todo lo que necesita dibujar viene
// en selection y visual. prefers-reduced-motion se lee aca, fuera del canvas, y baja
// como prop: adentro del canvas no entra Framer Motion.

const DPR: [number, number] = [1, 1.75]

type SignPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
}

export function SignPreview({ selection, visual, theme }: SignPreviewProps) {
  const reducedMotion = useReducedMotion() === true
  const palette = useMemo(() => scenePalette(theme), [theme])
  const box = signBoxMeters(selection, visual.lengthToMeters)

  if (!hasWebGL()) {
    return <SignPreviewFallback selection={selection} theme={theme} />
  }

  return (
    <div
      style={theme}
      className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--q-bg)]"
    >
      <Canvas dpr={DPR} gl={{ antialias: true }}>
        <SignScene
          box={box}
          material={visual.material}
          palette={palette}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  )
}
