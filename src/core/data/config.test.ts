import { describe, expect, it } from 'vitest'
import { dataConfigFrom, restHeaders, restUrl } from './config'

const URL_OK = 'https://abcdefghijklmnop.supabase.co'
const KEY_OK = 'clave-de-prueba'

describe('dataConfigFrom', () => {
  // 11.1
  it('devuelve null si falta, viene vacia o viene con espacios alguna de las dos', () => {
    expect(dataConfigFrom({})).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: URL_OK })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_ANON_KEY: KEY_OK })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: KEY_OK })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_ANON_KEY: '' })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: KEY_OK })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_ANON_KEY: '  ' })).toBeNull()
    expect(dataConfigFrom({ VITE_SUPABASE_URL: URL_OK, VITE_SUPABASE_ANON_KEY: KEY_OK })).toEqual({
      url: URL_OK,
      key: KEY_OK,
    })
  })

  // 11.2
  it('normaliza la url quitando la barra final', () => {
    const config = dataConfigFrom({
      VITE_SUPABASE_URL: `${URL_OK}/`,
      VITE_SUPABASE_ANON_KEY: ` ${KEY_OK} `,
    })
    expect(config).toEqual({ url: URL_OK, key: KEY_OK })
  })
})

describe('restUrl', () => {
  // 11.3
  it('arma la ruta de la tabla con y sin barra final en el origen', () => {
    expect(restUrl({ url: URL_OK, key: KEY_OK }, 'leads')).toBe(`${URL_OK}/rest/v1/leads`)
    expect(restUrl({ url: `${URL_OK}/`, key: KEY_OK }, 'leads')).toBe(`${URL_OK}/rest/v1/leads`)
    expect(restUrl({ url: URL_OK, key: KEY_OK }, 'visits')).toBe(`${URL_OK}/rest/v1/visits`)
  })
})

describe('restHeaders', () => {
  // 11.4
  it('da los cuatro headers de PostgREST', () => {
    expect(restHeaders({ url: URL_OK, key: KEY_OK })).toEqual({
      apikey: KEY_OK,
      Authorization: `Bearer ${KEY_OK}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    })
  })
})
