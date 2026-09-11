import { describe, expect, it } from 'vitest'
import { validateLeadForm } from './validateLeadForm'

describe('validateLeadForm', () => {
  // 11.11
  it('el nombre vacio o con espacios es invalido', () => {
    expect(validateLeadForm({ name: '', contact: 'ana@test.example' }).name).toBe(true)
    expect(validateLeadForm({ name: '   ', contact: 'ana@test.example' }).name).toBe(true)
    expect(validateLeadForm({ name: 'Ana', contact: 'ana@test.example' }).name).toBe(false)
  })

  // 11.12
  it('el contacto acepta mail o telefono de seis digitos, y rechaza el resto', () => {
    const conNombre = (contact: string) => validateLeadForm({ name: 'Ana', contact }).contact
    expect(conNombre('ana@test.example')).toBe(false)
    expect(conNombre('381 555 1234')).toBe(false)
    expect(conNombre('123456')).toBe(false)
    expect(conNombre('12345')).toBe(true)
    expect(conNombre('llamame')).toBe(true)
    expect(conNombre('')).toBe(true)
    expect(conNombre('   ')).toBe(true)
    expect(conNombre('@test.example')).toBe(true)
    expect(conNombre('ana@')).toBe(true)
  })
})
