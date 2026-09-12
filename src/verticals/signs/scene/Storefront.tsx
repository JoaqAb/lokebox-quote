import type { RefObject } from 'react'
import type { MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { PLACEMENT, SET, frameBars, mullionBars, type ScenePalette } from './sceneGeometry'

// Set fijo: fondo, vereda, fachada, zocalo, puerta y vidriera con sus marcos.
// Sin estado y sin useFrame. Todas las medidas y todos los colores vienen de
// sceneGeometry: aca no se escribe ni un numero de set ni un hexadecimal.
// La fachada se extiende mas alla del cuadro y tiene fondo detras, asi no aparece el
// canto de la pared ni el vacio en ningun punto del clamp de orbita (SPEC 12).

// El fondo y la vereda exponen su material por ref porque su color lo mueve el escalar
// dusk en el frame loop de SignScene: pasarlo como prop haria que React lo aplicara de
// una. Va la ref al material y no al mesh para no tener que castear mesh.material, que
// en el tipo de three puede ser un arreglo.
type StorefrontProps = {
  palette: ScenePalette
  backdropRef: RefObject<MeshBasicMaterial | null>
  sidewalkRef: RefObject<MeshStandardMaterial | null>
}

const doorFrame = frameBars(PLACEMENT.door.position, [SET.door.width, SET.door.height])
const windowFrame = frameBars(PLACEMENT.window.position, [SET.window.width, SET.window.height])
const mullions = mullionBars()

export function Storefront({ palette, backdropRef, sidewalkRef }: StorefrontProps) {
  return (
    <group>
      <mesh position={PLACEMENT.backdrop.position}>
        <planeGeometry args={PLACEMENT.backdrop.size} />
        <meshBasicMaterial ref={backdropRef} color={palette.backdrop} />
      </mesh>

      <mesh position={PLACEMENT.sidewalk.position} rotation={PLACEMENT.sidewalk.rotation}>
        <planeGeometry args={[SET.sidewalk.width, SET.sidewalk.depth]} />
        <meshStandardMaterial
          ref={sidewalkRef}
          color={palette.sidewalk}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      <mesh position={PLACEMENT.facade.position}>
        <boxGeometry args={PLACEMENT.facade.size} />
        <meshStandardMaterial color={palette.facade} roughness={0.85} metalness={0} />
      </mesh>

      <mesh position={PLACEMENT.base.position}>
        <boxGeometry args={PLACEMENT.base.size} />
        <meshStandardMaterial color={palette.base} roughness={0.9} metalness={0} />
      </mesh>

      <mesh position={PLACEMENT.door.position}>
        <boxGeometry args={PLACEMENT.door.size} />
        <meshStandardMaterial color={palette.doorFrame} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={PLACEMENT.window.position}>
        <boxGeometry args={PLACEMENT.window.size} />
        {/* El vidrio responde a la luz igual que la pared: con roughness y metalness
            propios se oscurecia distinto al caer la tarde y el salto contra la pared
            crecia hasta ganarle en contraste al cartel. Lo que hace legible la vidriera
            es su marco y sus divisiones, no el vidrio. */}
        <meshStandardMaterial
          color={palette.glass}
          emissive={palette.glass}
          emissiveIntensity={palette.glassEmissiveIntensity}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {[...doorFrame, ...windowFrame, ...mullions].map((bar, index) => (
        <mesh key={`${String(index)}-${String(bar.position[0])}`} position={bar.position}>
          <boxGeometry args={bar.size} />
          <meshStandardMaterial color={palette.windowFrame} roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
    </group>
  )
}
