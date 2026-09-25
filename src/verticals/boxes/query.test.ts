import { describe, expect, it } from 'vitest'
import { materialsForStyle } from './config'
import { decodeBoxQuery, encodeBoxQuery } from './query'
import { testConfigOf } from './testing'
import type { BoxSelection } from './types'

// Claves de la hoja de cajas (SPEC 21.3): ida y vuelta exacta en toda la matriz, y links invalidos.

const SIZES = ['min', 'default', 'max'] as const

function matrix(slug: 'foldline' | 'cajasur'): BoxSelection[] {
  const { options } = testConfigOf(slug)
  const list: BoxSelection[] = []
  for (const style of options.styles) {
    for (const material of materialsForStyle(options.materials, style.id)) {
      for (const printing of options.printing) {
        for (const tier of options.quantities) {
          for (const l of SIZES) {
            for (const w of SIZES) {
              for (const h of SIZES) {
                list.push({
                  style: style.id,
                  length: options.length[l],
                  width: options.width[w],
                  height: options.height[h],
                  materialId: material.id,
                  printingId: printing.id,
                  quantity: tier.qty,
                })
              }
            }
          }
        }
      }
    }
  }
  return list
}

describe('query de la hoja de cajas', () => {
  // 7 pares de estilo y material por 4 impresiones por 5 escalones por 27 medidas.
  for (const [slug, total] of [['foldline', 3780], ['cajasur', 3780]] as const) {
    it(`ida y vuelta exacta en ${String(total)} selecciones de ${slug}`, () => {
      const config = testConfigOf(slug)
      const cases = matrix(slug)
      expect(cases).toHaveLength(total)
      for (const selection of cases) {
        const query = encodeBoxQuery(selection)
        expect(query.split('&').map((pair) => pair.split('=')[0])).toEqual(['s', 'l', 'w', 'h', 'm', 'p', 'q'])
        expect(decodeBoxQuery(config.options, new URLSearchParams(query))).toStrictEqual(selection)
      }
    })
  }

  it('un link invalido devuelve null', () => {
    const { options } = testConfigOf('foldline')
    const ok = 's=mailer&l=10&w=8&h=4&m=kraft&p=one&q=250'
    expect(decodeBoxQuery(options, new URLSearchParams(ok))).not.toBeNull()
    for (const bad of [
      's=mailer&l=10&w=8&h=4&m=rigid&p=one&q=250',
      's=mailer&l=10&w=8&h=4&m=kraft&p=one&q=300',
      's=mailer&l=10&w=8&h=4&m=kraft&p=one&q=2.5',
      's=mailer&l=10&w=8&h=4&m=kraft&p=one',
      's=mailer&l=10&w=8&m=kraft&p=one&q=250',
      `${ok}&x=1`,
      `${ok}&q=250`,
      's=tube&l=10&w=8&h=4&m=kraft&p=one&q=250',
      's=mailer&l=10&w=8&h=4&m=kraft&p=gold&q=250',
      's=mailer&l=30&w=8&h=4&m=kraft&p=one&q=250',
      's=mailer&l=&w=8&h=4&m=kraft&p=one&q=250',
      's=mailer&l=abc&w=8&h=4&m=kraft&p=one&q=250',
    ]) {
      expect(decodeBoxQuery(options, new URLSearchParams(bad)), bad).toBeNull()
    }
  })
})
