import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState, type ReactNode } from 'react'
import { LoadingScreen, type LoadingBrand } from '../ui/LoadingScreen'
import { pickQuality, readDevice } from './quality'
import { RenderPipeline } from './RenderPipeline'
import { StripOverlapContext, useMeasuredStrip } from './stripOverlap'

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
// - Desde 2.17 (D160) mide cuanto tapa la franja de controles el pie del canvas y lo pasa a la
//   escena por StripOverlapContext: el encuadre de estudio lo descuenta.

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

// Mapas de sombra una vez por cuadro (SPEC 12, version 2.8, D88). three los dibuja en cada render
// con los objetos de las capas de la camara de ese render, y el composer hace varios por cuadro: la
// seleccion del bloom, con la camara en su capa, los dejaba sin los objetos de la capa 0. Con
// autoUpdate apagado, se piden una vez por cuadro antes del composer (prioridad 0, que corre antes
// que su 1): los dibuja el primer render, el pase principal con la camara en las capas que
// proyectan, y los demas los reusan. autoUpdate se apaga al crear el canvas.
function ShadowMaps() {
  useFrame((state) => {
    state.gl.shadowMap.needsUpdate = true
  }, 0)
  return null
}

export function PreviewCanvas({ loading, children }: PreviewCanvasProps) {
  // Una vez al montar y nunca mas (D46).
  const [quality] = useState(() => pickQuality(readDevice()))
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strip = useMeasuredStrip(canvasRef)

  return (
    <StripOverlapContext value={strip}>
      <Canvas
        ref={canvasRef}
        flat
        shadows="percentage"
        dpr={quality.dpr}
        gl={{ antialias: false, alpha: true }}
        onCreated={(state) => {
          state.gl.shadowMap.autoUpdate = false
        }}
        className="!absolute inset-0"
        style={{ background: 'transparent' }}
      >
        <ShadowMaps />
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
    </StripOverlapContext>
  )
}
