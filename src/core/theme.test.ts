import { describe, expect, it } from 'vitest'
import { DARK_THEME_LUMINANCE, relativeLuminance, stageToneOf } from './theme'

// Los tests del tema sobre los clientes del registro estan en src/app/clients.test.ts: el core no
// importa de src/clients.

// D132: el tono del escenario sale de la luminancia relativa del fondo del tema.
describe('relativeLuminance y stageToneOf', () => {
  it('da los extremos de WCAG en negro y blanco, y el gris medio de sRGB', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 10)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10)
    // 0x80 = 128: (128/255 + 0.055) / 1.055, a la 2.4.
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2158605, 6)
  })

  it('pesa cada canal con los coeficientes de WCAG', () => {
    expect(relativeLuminance('#FF0000')).toBeCloseTo(0.2126, 10)
    expect(relativeLuminance('#00FF00')).toBeCloseTo(0.7152, 10)
    expect(relativeLuminance('#0000FF')).toBeCloseTo(0.0722, 10)
  })

  it('lanza con un color que no es #RRGGBB, nombrandolo', () => {
    for (const value of ['#FFF', 'FFFFFF', 'rgb(0, 0, 0)', '#GGGGGG', '']) {
      expect(() => relativeLuminance(value), value).toThrow(`"${value}"`)
    }
  })

  it('es oscuro por debajo de 0,2 y claro desde 0,2', () => {
    expect(DARK_THEME_LUMINANCE).toBe(0.2)
    // #7C7C7C da 0,2016 y #7B7B7B da 0,1981.
    expect(stageToneOf('#7C7C7C')).toBe('light')
    expect(stageToneOf('#7B7B7B')).toBe('dark')
    expect(stageToneOf('#000000')).toBe('dark')
    expect(stageToneOf('#FFFFFF')).toBe('light')
  })

})
