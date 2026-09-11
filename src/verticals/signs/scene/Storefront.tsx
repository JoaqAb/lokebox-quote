import { PLACEMENT, SET, type ScenePalette } from './sceneGeometry'

// Set fijo: vereda, fachada, puerta y vidriera. Sin estado y sin useFrame.
// Todas las medidas y todos los colores vienen de sceneGeometry.

type StorefrontProps = {
  palette: ScenePalette
}

export function Storefront({ palette }: StorefrontProps) {
  return (
    <group>
      <mesh position={PLACEMENT.sidewalk.position} rotation={PLACEMENT.sidewalk.rotation}>
        <planeGeometry args={[SET.sidewalk.width, SET.sidewalk.depth]} />
        <meshStandardMaterial color={palette.sidewalk} roughness={0.95} metalness={0} />
      </mesh>

      <mesh position={PLACEMENT.facade.position}>
        <boxGeometry args={PLACEMENT.facade.size} />
        <meshStandardMaterial color={palette.facade} roughness={0.85} metalness={0} />
      </mesh>

      <mesh position={PLACEMENT.door.position}>
        <boxGeometry args={PLACEMENT.door.size} />
        <meshStandardMaterial color={palette.doorFrame} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={PLACEMENT.window.position}>
        <boxGeometry args={PLACEMENT.window.size} />
        <meshStandardMaterial
          color={palette.glass}
          emissive={palette.glass}
          emissiveIntensity={palette.glassEmissiveIntensity}
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>
    </group>
  )
}
