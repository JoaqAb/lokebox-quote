import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, DoubleSide, MeshPhysicalMaterial, type Group, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { StudioCamera } from '../../../core/preview/StudioCamera'
import { StudioEnvironment } from '../../../core/preview/StudioEnvironment'
import { StudioKeyLight } from '../../../core/preview/StudioKeyLight'
import { disposeSurfaceTextures, setSurfaceRepeat, surfaceTextures } from '../../../core/preview/finishTextures'
import { physicalParamsOf, setPhysical } from '../../../core/preview/physicalSurface'
import { STUDIO_BRIGHT, SUPPORT_SHADOW_COLOR, approach, studioShadowReach, type Vec3 } from '../../../core/preview/studioView'
import { supportShadowTexture } from '../../../core/preview/supportShadow'
import type { BoxVisual } from '../visuals'
import { BOX_EDGE, BOX_SHADOW, BOX_START, FACE, LOGO, boxRig, edgeRadius, frameOf, groupPose, logoSize, type FaceIndex, type Panel } from './boxGeometry'
import type { LogoTextures } from './logoTexture'

// La escena de cajas (SPEC 21.5): solo estudio, con la camara, la luz de estudio sin iluminacion,
// el entorno y la sombra de apoyo del core. Nada emite. La caja se arma por forma con planchas del
// espesor del material; la cara interior de cada plancha va en el acento del tema cuando la
// impresion imprime adentro. El logo va en su cara exterior. Abrir y cerrar es una transicion con
// el damp del core, sin efecto en el precio. La camara encuadra la caja tal como esta en cada
// momento de la apertura.

type BoxSceneProps = {
  visual: BoxVisual
  accent: string
  logo: LogoTextures | null
  open: boolean
  zoom: number
  reducedMotion: boolean
}

// Blanco: la luz de estudio no lleva tinte.
const WHITE: [number, number, number] = [1, 1, 1]

// Metros de superficie de referencia para repetir el mapa del acabado: el lado mayor de la caja.
function repeatMeters(visual: BoxVisual): number {
  return Math.max(visual.dims.length, visual.dims.width, visual.dims.height)
}

function useBoxMaterials(visual: BoxVisual, accent: string): { outer: MeshPhysicalMaterial; inner: MeshPhysicalMaterial } {
  const materials = useMemo(() => ({ outer: new MeshPhysicalMaterial(), inner: new MeshPhysicalMaterial() }), [])
  const { material, printing } = visual
  const size = repeatMeters(visual)
  useEffect(() => {
    const textures = [surfaceTextures(material.finish), surfaceTextures(material.finish)]
    const params = physicalParamsOf(material)
    ;[materials.outer, materials.inner].forEach((physical, index) => {
      setSurfaceRepeat(textures[index], material.finish, size, size)
      setPhysical(physical, params)
      physical.roughnessMap = textures[index].roughness
      physical.normalMap = textures[index].normal
      physical.needsUpdate = true
    })
    materials.outer.color.set(material.color)
    materials.inner.color.set(printing.inside ? accent : material.color)
    return () => {
      textures.forEach(disposeSurfaceTextures)
    }
  }, [materials, material, printing.inside, accent, size])
  useEffect(
    () => () => {
      materials.outer.dispose()
      materials.inner.dispose()
    },
    [materials],
  )
  return materials
}

// Una lista de materiales por cara, con el interior en la cara que mira adentro.
function faceMaterials(outer: Material, inner: Material): Record<FaceIndex, Material[]> {
  const list = {} as Record<FaceIndex, Material[]>
  for (const index of Object.values(FACE)) {
    list[index] = Object.values(FACE).map((face) => (face === index ? inner : outer))
  }
  return list
}

// Posicion y giro del logo sobre la cara exterior de su plancha.
function logoPlacement(panel: Panel, face: FaceIndex): { position: Vec3; rotation: Vec3; face: [number, number] } {
  const [sx, sy, sz] = panel.size
  const [ox, oy, oz] = panel.offset
  if (face === FACE.py) {
    return { position: [ox, oy + sy / 2 + LOGO.lift, oz], rotation: [-Math.PI / 2, 0, 0], face: [sx, sz] }
  }
  return { position: [ox, oy, oz + sz / 2 + LOGO.lift], rotation: [0, 0, 0], face: [sx, sy] }
}

export function BoxScene({ visual, accent, logo, open, zoom, reducedMotion }: BoxSceneProps) {
  const rig = useMemo(() => boxRig(visual.shape, visual.dims), [visual.shape, visual.dims])
  // Apertura con la que se encuadra: sigue a la amortiguada del frame loop, que la actualiza
  // mientras la tapa se mueve. Asi el encuadre acompana a la tapa sin salto.
  const [frameOpen, setFrameOpen] = useState(open ? 1 : 0)
  const frame = useMemo(() => frameOf(rig, frameOpen), [rig, frameOpen])
  const reach = studioShadowReach(frame.volume, frame.center)
  const { outer, inner } = useBoxMaterials(visual, accent)
  const byInner = useMemo(() => faceMaterials(outer, inner), [outer, inner])
  const white = useMemo(() => new Color(...WHITE), [])

  // Una geometria redondeada por plancha, armada a su medida y liberada al cambiar.
  const radius = edgeRadius(visual.dims.thickness)
  const geometries = useMemo(
    () => rig.groups.map((group) => group.panels.map((panel) => new RoundedBoxGeometry(...panel.size, BOX_EDGE.segments, radius))),
    [rig, radius],
  )
  useEffect(
    () => () => {
      geometries.flat().forEach((geometry) => {
        geometry.dispose()
      })
    },
    [geometries],
  )

  // Apertura amortiguada: el primer frame va de golpe.
  const groupRefs = useRef<(Group | null)[]>([])
  const openRef = useRef<number | null>(null)
  useFrame((_state, delta) => {
    const target = open ? 1 : 0
    const current = openRef.current
    const next = current === null || reducedMotion ? target : approach(current, target, delta)
    openRef.current = next
    if (next !== frameOpen) {
      setFrameOpen(next)
    }
    rig.groups.forEach((group, index) => {
      const node = groupRefs.current[index]
      if (node === null || node === undefined) {
        return
      }
      const pose = groupPose(group, next)
      node.position.set(...pose.position)
      node.rotation.set(...pose.rotation)
    })
  })

  const print = logo === null || visual.printing.logo === 'none' ? null : visual.printing.logo === 'accent' ? logo.accent : logo.original
  const [outerX, , outerZ] = rig.outer

  return (
    <>
      <StudioCamera volume={frame.volume} center={frame.center} zoom={zoom} reducedMotion={reducedMotion} start={BOX_START} />
      <StudioKeyLight light={STUDIO_BRIGHT.light} color={white} reach={reach} />
      <StudioEnvironment intensity={STUDIO_BRIGHT.environment} highlight={null} color={WHITE} />

      {rig.groups.map((group, groupIndex) => (
        <group
          key={`${visual.shape}-${group.key}`}
          ref={(node) => {
            groupRefs.current[groupIndex] = node
          }}
        >
          {group.panels.map((panel, panelIndex) => {
            const placement = panel.logo === undefined || print === null || logo === null ? null : logoPlacement(panel, panel.logo)
            const size = placement === null || logo === null ? null : logoSize(placement.face, logo.aspect)
            return (
              <group key={panel.key}>
                <mesh
                  geometry={geometries[groupIndex][panelIndex]}
                  material={byInner[panel.inner]}
                  position={panel.offset}
                  castShadow
                  receiveShadow
                />
                {placement === null || size === null ? null : (
                  <mesh position={placement.position} rotation={placement.rotation} receiveShadow>
                    <planeGeometry args={size} />
                    <meshStandardMaterial
                      map={print}
                      transparent
                      depthWrite={false}
                      polygonOffset
                      polygonOffsetFactor={-1}
                      roughness={visual.material.roughness}
                      metalness={0}
                      side={DoubleSide}
                    />
                  </mesh>
                )}
              </group>
            )
          })}
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOX_SHADOW.lift, 0]} scale={[outerX * BOX_SHADOW.scale, outerZ * BOX_SHADOW.scale, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={SUPPORT_SHADOW_COLOR}
          alphaMap={supportShadowTexture()}
          transparent
          opacity={BOX_SHADOW.opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}
