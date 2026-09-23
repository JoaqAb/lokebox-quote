import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState, type ReactNode } from 'react'
import { LoadingScreen, type LoadingBrand } from '../ui/LoadingScreen'
import { pickQuality, readDevice } from './quality'
import { RenderPipeline } from './RenderPipeline'

// El canvas del preview (SPEC 18): lo monta el core y la vertical entrega su escena como
// children. Aca se deciden el renderer, el perfil de calidad, el pipeline y la pantalla de
// carga; la vertical decide que hay en la escena, que proyecta sombra y que emite.
// - antialias apagado y flat (NoToneMapping): el AA y el tone mapping los hace el pipeline,
//   una sola vez.
// - alpha: en modo vista el canvas va transparente sobre la foto, que es una capa HTML debajo.
// - shadows "percentage": PCFShadowMap. En three 0.185 PCFSoftShadowMap esta deprecado, avisa
//   por consola y cae a PCFShadowMap, que ya filtra suave con el radio de cada luz.
// - Un solo Suspense envuelve la escena y el pipeline: los assets que suspenden (el
//   typeface) pasan por el LoadingManager de three, que es lo que lee la pantalla de carga.

type PreviewCanvasProps = {
  loading: LoadingBrand
  children: ReactNode
}

// Avisa una sola vez, despues del primer frame que dibujo la escena ya resuelta. Prioridad 2:
// corre despues del render del composer, que usa la 1.
function FirstFrame({ onFirstFrame }: { onFirstFrame: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (!done.current) {
      done.current = true
      onFirstFrame()
    }
  }, 2)
  return null
}

export function PreviewCanvas({ loading, children }: PreviewCanvasProps) {
  // Una vez al montar y nunca mas (D46).
  const [quality] = useState(() => pickQuality(readDevice()))
  const [ready, setReady] = useState(false)

  return (
    <>
      <Canvas
        flat
        shadows="percentage"
        dpr={quality.dpr}
        gl={{ antialias: false, alpha: true }}
        className="!absolute inset-0"
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {children}
          <RenderPipeline quality={quality} />
          <FirstFrame
            onFirstFrame={() => {
              setReady(true)
            }}
          />
        </Suspense>
      </Canvas>
      <LoadingScreen brand={loading} done={ready} />
    </>
  )
}
