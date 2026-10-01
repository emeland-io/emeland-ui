import { describe, expect, it } from 'vitest'
import { blankDocument } from '@/editor/kinds'
import { issuesToFieldErrors, validateDocument } from '@/editor/document'

describe('field validation rules', () => {
  it('rejects non-UUID values on UUID fields', () => {
    const doc = blankDocument('API')
    doc.spec.system = 'abcd'
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(issuesToFieldErrors(result.issues).system).toBe('Must be a valid UUID')
  })

  it('rejects invalid UUIDs in comma-separated ref lists', () => {
    const doc = blankDocument('Component')
    doc.spec.system = '550e8400-e29b-41d4-a716-446655440001'
    doc.spec.consumes = ['abcd', '550e8400-e29b-41d4-a716-446655440002']
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(issuesToFieldErrors(result.issues).consumes).toMatch(/UUID/)
  })

  it('flags empty required UUID fields', () => {
    const doc = blankDocument('Node')
    doc.spec.nodeType = ''
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(issuesToFieldErrors(result.issues).nodeType).toMatch(/UUID|Required/)
  })

  it('accepts a well-formed UUID', () => {
    const doc = blankDocument('API')
    doc.spec.system = '550e8400-e29b-41d4-a716-446655440001'
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('rejects empty required display name', () => {
    const doc = blankDocument('API')
    doc.spec.displayName = '   '
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(issuesToFieldErrors(result.issues).displayName).toMatch(/Required/)
  })

  it('rejects empty annotation values', () => {
    const doc = blankDocument('API')
    doc.spec.annotations = { owner: '' }
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(
      result.issues.some((i) => i.path.includes('annotations') && /value/i.test(i.message)),
    ).toBe(true)
  })

  it('maps annotation errors only to the invalid key', () => {
    const doc = blankDocument('API')
    doc.spec.annotations = {
      owner: 'platform',
      'emeland.io/last-update': 'not-a-timestamp',
    }
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    const errors = issuesToFieldErrors(result.issues)
    expect(errors.annotations).toBeUndefined()
    expect(errors['annotations.owner']).toBeUndefined()
    expect(errors['annotations.emeland.io/last-update']).toMatch(/timestamp/i)
  })
})
