import { describe, expect, it } from 'vitest'
import { pickQuality, QUALITY, type DeviceCapability } from './quality'

const DESKTOP: DeviceCapability = { coarsePointer: false, deviceMemoryGb: 8, cores: 12 }

describe('pickQuality', () => {
  it('un equipo de escritorio con memoria y nucleos va a high', () => {
    expect(pickQuality(DESKTOP).id).toBe('high')
  })

  it('puntero grueso va a medium aunque sobre memoria', () => {
    expect(pickQuality({ ...DESKTOP, coarsePointer: true }).id).toBe('medium')
  })

  it('4 GB de memoria o menos va a medium', () => {
    expect(pickQuality({ ...DESKTOP, deviceMemoryGb: 4 }).id).toBe('medium')
    expect(pickQuality({ ...DESKTOP, deviceMemoryGb: 8 }).id).toBe('high')
  })

  it('4 nucleos o menos va a medium', () => {
    expect(pickQuality({ ...DESKTOP, cores: 4 }).id).toBe('medium')
    expect(pickQuality({ ...DESKTOP, cores: 6 }).id).toBe('high')
  })

  it('lo que el navegador no informa no baja el perfil', () => {
    expect(pickQuality({ coarsePointer: false, deviceMemoryGb: undefined, cores: undefined }).id).toBe('high')
  })

  it('medium usa la mitad de las muestras de AO y un dpr mas bajo', () => {
    expect(QUALITY.medium.ao.samples).toBe(QUALITY.high.ao.samples / 2)
    expect(QUALITY.medium.ao.denoiseSamples).toBe(QUALITY.high.ao.denoiseSamples / 2)
    expect(QUALITY.high.dpr).toEqual([1, 2])
    expect(QUALITY.medium.dpr).toEqual([1, 1.5])
  })
})
