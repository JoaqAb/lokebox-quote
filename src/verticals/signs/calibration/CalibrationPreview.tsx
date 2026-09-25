import { useState, type MouseEvent } from 'react'
import type { ClientPhoto, PhotoAnchor, PhotoGroundAnchor, SignSelection } from '../types'
import type { LoadingBrand } from '../../../core/ui/LoadingScreen'
import { PhotoStage } from '../PhotoStage'
import type { SignVisual } from '../visuals'

// Modo de calibracion de TAREA_011: herramienta de desarrollo, no de producto.
// Solo se monta con ?calibrate=1 y en el build de desarrollo (QuotePage lo corta con
// import.meta.env.DEV), asi que no llega a produccion y no consume claves de texts.
// Los rotulos son los nombres de las claves del JSON a proposito: lo que se lee en
// pantalla se copia tal cual a photos[].anchor.
// Usa el mismo PhotoStage que el preview, sin zoom: se calibra contra el SignBoard real.
// Desde la version 2.7 (D85) dibuja tambien la linea de anchorGround.wallY, donde la fachada toca
// la vereda en la columna del apoyo, y la deja ajustar con su control.

type CalibrationPreviewProps = {
  selection: SignSelection
  visual: SignVisual
  theme: Record<string, string>
  photos: ClientPhoto[]
  loading: LoadingBrand
}

type Pointer = { x: number; y: number }

const SLIDERS = [
  { key: 'metersToWidth', min: 0.01, max: 0.3, step: 0.001 },
  { key: 'cameraYawDeg', min: -80, max: 80, step: 0.5 },
  { key: 'cameraPitchDeg', min: -45, max: 45, step: 0.5 },
  { key: 'fovDeg', min: 10, max: 90, step: 0.5 },
] as const

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function CalibrationPreview({ selection, visual, theme, photos, loading }: CalibrationPreviewProps) {
  const [photoId, setPhotoId] = useState(photos[0].id)
  const [anchors, setAnchors] = useState<Record<string, PhotoAnchor>>(() =>
    Object.fromEntries(photos.map((item) => [item.id, item.anchor])),
  )
  const [grounds, setGrounds] = useState<Record<string, PhotoGroundAnchor | undefined>>(() =>
    Object.fromEntries(photos.map((item) => [item.id, item.anchorGround])),
  )
  const [pointer, setPointer] = useState<Pointer | null>(null)

  const basePhoto = photos.find((item) => item.id === photoId) ?? photos[0]
  const anchor = anchors[basePhoto.id]
  const ground = grounds[basePhoto.id]
  const photo: ClientPhoto = { ...basePhoto, anchor, anchorGround: ground }

  function updateAnchor(patch: Partial<PhotoAnchor>): void {
    setAnchors((current) => ({ ...current, [basePhoto.id]: { ...current[basePhoto.id], ...patch } }))
  }

  // Fraccion 0 a 1 del ancho y del alto de la foto: las unidades del campo anchor.
  // La foto es 16:9 igual que el cuadro, asi que el recuadro del cuadro es el de la foto.
  function pointerFromEvent(event: MouseEvent<HTMLDivElement>): Pointer {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: round(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), 3),
      y: round(Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)), 3),
    }
  }

  function updateWallY(wallY: number): void {
    setGrounds((current) => {
      const known = current[basePhoto.id]
      return known === undefined ? current : { ...current, [basePhoto.id]: { ...known, wallY } }
    })
  }

  const json = JSON.stringify(
    photos.map((item) => ({ id: item.id, anchor: anchors[item.id], anchorGround: grounds[item.id] })),
    null,
    2,
  )

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div
        style={theme}
        data-calibration-stage
        className="q-hairline relative aspect-video w-full cursor-crosshair overflow-hidden rounded-2xl border bg-[var(--q-surface)]"
        onPointerMove={(event) => {
          setPointer(pointerFromEvent(event))
        }}
        onPointerLeave={() => {
          setPointer(null)
        }}
        onClick={(event) => {
          updateAnchor(pointerFromEvent(event))
        }}
      >
        <PhotoStage
          selection={selection}
          visual={visual}
          theme={theme}
          photo={photo}
          reducedMotion
          cssZoom={1}
          signZoom={1}
          loading={loading}
        />
        {pointer === null ? null : (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 h-px bg-[var(--q-accent)]" style={{ top: `${String(pointer.y * 100)}%` }} />
            <div className="absolute inset-y-0 w-px bg-[var(--q-accent)]" style={{ left: `${String(pointer.x * 100)}%` }} />
          </div>
        )}
        <div
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--q-accent)]"
          style={{ left: `${String(anchor.x * 100)}%`, top: `${String(anchor.y * 100)}%` }}
        />
        {ground === undefined ? null : (
          <div
            data-calibration-wall
            className="pointer-events-none absolute inset-x-0 h-0.5 bg-[var(--q-accent)] opacity-80"
            style={{ top: `${String(ground.wallY * 100)}%` }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {photos.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === basePhoto.id}
            className={item.id === basePhoto.id ? 'q-control q-on flex-1' : 'q-control q-off flex-1'}
            onClick={() => {
              setPhotoId(item.id)
            }}
          >
            {item.id}
          </button>
        ))}
      </div>

      <p data-calibration-readout>
        pointer x {pointer === null ? '-' : pointer.x} y {pointer === null ? '-' : pointer.y} · anchor x {anchor.x} y{' '}
        {anchor.y}
      </p>

      {SLIDERS.map((slider) => (
        <label key={slider.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0">{slider.key}</span>
          <input
            type="range"
            data-calibration-key={slider.key}
            className="q-range h-8 min-w-0 flex-1"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={anchor[slider.key]}
            onChange={(event) => {
              updateAnchor({ [slider.key]: event.currentTarget.valueAsNumber })
            }}
          />
          <span className="w-14 shrink-0 text-right">{anchor[slider.key]}</span>
        </label>
      ))}

      {ground === undefined ? null : (
        <label className="flex items-center gap-3">
          <span className="w-28 shrink-0">wallY</span>
          <input
            type="range"
            data-calibration-key="wallY"
            className="q-range h-8 min-w-0 flex-1"
            min={0.5}
            max={1}
            step={0.001}
            value={ground.wallY}
            onChange={(event) => {
              updateWallY(event.currentTarget.valueAsNumber)
            }}
          />
          <span className="w-14 shrink-0 text-right">{ground.wallY}</span>
        </label>
      )}

      <button
        type="button"
        className="q-control q-off"
        onClick={() => {
          void navigator.clipboard.writeText(json)
        }}
      >
        copy JSON
      </button>
      <pre data-calibration-json className="max-h-40 overflow-auto">
        {json}
      </pre>
    </div>
  )
}
