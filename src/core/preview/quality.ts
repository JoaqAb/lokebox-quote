// Perfiles de calidad del preview (SPEC 12, version 2.0, D46). Se elige uno una sola vez al
// montar, por capacidad del dispositivo, y no cambia en caliente: no se mide fps. Un cambio
// de perfil en caliente rearma el composer y se ve como un salto de la imagen.
// La eleccion es una funcion pura; la lectura del navegador va aparte, en readDevice.

export type QualityId = 'high' | 'medium'

export type QualityProfile = {
  id: QualityId
  // Rango de pixel ratio del canvas: R3F lo acota al del dispositivo.
  dpr: [number, number]
  // Muestras de N8AO y de su denoise. high usa las de fabrica de N8AO y medium la mitad.
  ao: { samples: number; denoiseSamples: number }
}

export const QUALITY: Record<QualityId, QualityProfile> = {
  high: { id: 'high', dpr: [1, 2], ao: { samples: 16, denoiseSamples: 4 } },
  medium: { id: 'medium', dpr: [1, 1.5], ao: { samples: 8, denoiseSamples: 2 } },
}

// Lo que se sabe del dispositivo. deviceMemory solo existe en Chromium y se redondea a una
// potencia de dos con tope 8; hardwareConcurrency puede faltar. Lo ausente no baja el perfil.
export type DeviceCapability = {
  coarsePointer: boolean
  deviceMemoryGb: number | undefined
  cores: number | undefined
}

// Por debajo o en este valor, el dispositivo va a medium.
export const MEDIUM_AT = { deviceMemoryGb: 4, cores: 4 } as const

// Puntero grueso es telefono o tablet: pantalla chica con densidad alta, donde dpr 2 cuadruplica
// el costo del AO y no se nota. Poca memoria o pocos nucleos, lo mismo en un equipo de escritorio.
export function pickQuality(device: DeviceCapability): QualityProfile {
  const lowMemory = device.deviceMemoryGb !== undefined && device.deviceMemoryGb <= MEDIUM_AT.deviceMemoryGb
  const fewCores = device.cores !== undefined && device.cores <= MEDIUM_AT.cores
  return device.coarsePointer || lowMemory || fewCores ? QUALITY.medium : QUALITY.high
}

export function readDevice(): DeviceCapability {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    cores: nav.hardwareConcurrency > 0 ? nav.hardwareConcurrency : undefined,
  }
}
