import { describe, expect, it } from 'vitest'
import { buildVisitRow, visitKey } from './visit'

describe('visita', () => {
  // 11.13
  it('la clave lleva el slug y la fila corta el user agent y anula el referrer vacio', () => {
    expect(visitKey('northline')).toBe('lq_visit_northline')
    expect(visitKey('norte')).toBe('lq_visit_norte')

    const row = buildVisitRow('northline', 'x'.repeat(600), '')
    expect(String(row.user_agent)).toHaveLength(400)
    expect(row.referrer).toBeNull()
    expect(row.client_slug).toBe('northline')

    const conReferrer = buildVisitRow('norte', 'Mozilla', ' https://google.com ')
    expect(conReferrer.referrer).toBe('https://google.com')
  })
})
