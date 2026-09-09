import { describe, it, expect } from 'vitest'
import { GENERATED_ANNOTATIONS } from '@/annotations/catalog.gen'

describe('generated annotations catalog', () => {
  it('has unique keys and suffixes', () => {
    const keys = GENERATED_ANNOTATIONS.map((d) => d.key)
    const suffixes = GENERATED_ANNOTATIONS.map((d) => d.suffix)
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(suffixes).size).toBe(suffixes.length)
  })

  it('every suffix is the key without the emeland.io/ prefix', () => {
    for (const d of GENERATED_ANNOTATIONS) {
      expect(d.key, d.key).toBe(`emeland.io/${d.suffix}`)
    }
  })

  it('every entry is complete', () => {
    for (const d of GENERATED_ANNOTATIONS) {
      expect(d.label, d.key).toBeTruthy()
      expect(d.purpose, d.key).toBeTruthy()
      expect(d.example, d.key).toBeTruthy()
      expect(d.appliesTo, d.key).toBeTruthy()
      expect(d.category, d.key).toBeTruthy()
      if (d.level) expect(['required', 'recommended', 'optional']).toContain(d.level)
      if (d.format) expect(['timestamp']).toContain(d.format)
    }
  })

  it('carries the modelsrv registries', () => {
    const suffixes = new Set(GENERATED_ANNOTATIONS.map((d) => d.suffix))
    for (const key of [
      'endpoint.protocol',
      'endpoint.host',
      'owner-identities',
      'owner-groups',
      'source',
      'threshold.expression',
      'thresholds',
      'k8s-sensor/context-parent',
      'p8-artifact-instance-location',
    ]) {
      expect(suffixes.has(key), key).toBe(true)
    }
  })
})
