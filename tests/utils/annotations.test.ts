import { describe, it, expect } from 'vitest'
import { differingAnnotationKeys, wellKnownAnnotations } from '@/utils/annotations'

describe('wellKnownAnnotations', () => {
  it('recognizes registry keys and namespaced suffix matches', () => {
    const rows = wellKnownAnnotations({
      'emeland.io/endpoint.host': 'api.example.com',
      'emeland.io/owner-identities': 'platform-team',
      'eximpl.emeland.io/last-update': '2026-09-01T10:00:00Z',
      'eximpl.emeland.io/tier': 'gold',
    })
    const byKey = new Map(rows.map((r) => [r.key, r]))
    expect(byKey.get('endpoint.host')?.value).toBe('api.example.com')
    expect(byKey.get('owner-identities')?.label).toBe('Owner identities')
    expect(byKey.get('last-update')?.value).toBe('2026-09-01 10:00 UTC')
    expect(byKey.has('tier')).toBe(false)
  })
})

describe('differingAnnotationKeys', () => {
  it('returns keys whose values differ across instances, sorted', () => {
    const keys = differingAnnotationKeys([
      { 'emeland.io/endpoint.host': 'a.example.com', 'emeland.io/endpoint.port': '443' },
      { 'emeland.io/endpoint.host': 'b.example.com', 'emeland.io/endpoint.port': '443' },
    ])
    expect(keys).toEqual(['emeland.io/endpoint.host'])
  })

  it('counts keys that are absent on some instances', () => {
    const keys = differingAnnotationKeys([
      { 'emeland.io/endpoint.host': 'h', 'emeland.io/endpoint.port': '443' },
      { 'emeland.io/endpoint.host': 'h' },
    ])
    expect(keys).toEqual(['emeland.io/endpoint.port'])
  })

  it('is empty when all instances share the same annotations', () => {
    expect(
      differingAnnotationKeys([
        { 'emeland.io/endpoint.host': 'h', env: 'prod' },
        { 'emeland.io/endpoint.host': 'h', env: 'prod' },
      ]),
    ).toEqual([])
  })

  it('is empty for fewer than two instances', () => {
    expect(differingAnnotationKeys([])).toEqual([])
    expect(differingAnnotationKeys([{ a: '1' }])).toEqual([])
  })

  it('compares across more than two instances', () => {
    const keys = differingAnnotationKeys([
      { 'emeland.io/endpoint.host': 'a' },
      { 'emeland.io/endpoint.host': 'a' },
      { 'emeland.io/endpoint.host': 'b' },
    ])
    expect(keys).toEqual(['emeland.io/endpoint.host'])
  })
})
