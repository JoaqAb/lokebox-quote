import type { Material, Mesh } from 'three'
import type { LetterBox, Vec3 } from './sceneGeometry'
import { glyphParts, type Typeface } from './typeface'

// El texto 3D del cartel (SPEC 12, version 1.14), unico para los dos modos: una letra por
// caracter con TextGeometry del typeface, con su contorno real, canto y bisel. Sin Text ni
// Text3D de drei. Modo letters: las letras corporeas. Modo area: el relieve de la cara.
// La geometria de cada caracter esta memoizada en unidades (alto de mayuscula 1 y
// profundidad 1); el tamano va con scale, asi mover un slider no regenera nada.
// Los materiales no se deciden aca: los pone quien monta el texto, que es quien los anima
// con el damp del cartel. Son tres, en el orden de TEXT_FACE, y los comparten todas las letras.
// Desde la version 2.1 cada letra son dos mallas sobre la misma geometria, la cara y la
// cascara (surfaceParts): quien monta el texto decide cual entra al bloom, con onMesh.

export type LetterPart = 'face' | 'shell'

type SignText3DProps = {
  typeface: Typeface
  letters: LetterBox[]
  // Alto de mayuscula y profundidad de cada letra, en metros.
  height: number
  depth: number
  position: Vec3
  materials: Material[]
  owner: string
  onMesh?: (key: string, part: LetterPart, mesh: Mesh | null) => void
}

export function SignText3D({ typeface, letters, height, depth, position, materials, owner, onMesh }: SignText3DProps) {
  if (height <= 0 || depth <= 0) {
    return null
  }
  return (
    <group position={position}>
      {letters.map((letter, index) => {
        const parts = glyphParts(typeface, letter.char)
        if (parts === null) {
          return null
        }
        const key = `${owner}-${letter.char}-${String(index)}`
        return (
          <group key={key} position={[letter.x * height, 0, 0]} scale={[height, height, depth]}>
            {(['face', 'shell'] as const).map((part) => (
              <mesh
                key={part}
                geometry={parts[part]}
                material={materials}
                castShadow
                receiveShadow
                ref={onMesh === undefined ? undefined : (mesh) => {
                  onMesh(key, part, mesh)
                }}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
