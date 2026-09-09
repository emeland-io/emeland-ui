import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsAnnotationsView from '@/views/SettingsAnnotationsView.vue'
import { WELL_KNOWN_ANNOTATIONS } from '@/utils/annotations'

describe('WELL_KNOWN_ANNOTATIONS catalog', () => {
  it('has unique suffixes and complete entries', () => {
    const suffixes = WELL_KNOWN_ANNOTATIONS.map((d) => d.suffix)
    expect(new Set(suffixes).size).toBe(suffixes.length)
    for (const def of WELL_KNOWN_ANNOTATIONS) {
      expect(def.label).toBeTruthy()
      expect(def.appliesTo).toBeTruthy()
      expect(def.category).toBeTruthy()
    }
  })

  it('carries the modelsrv registries', () => {
    const suffixes = new Set(WELL_KNOWN_ANNOTATIONS.map((d) => d.suffix))
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

describe('SettingsAnnotationsView', () => {
  it('renders every catalog key grouped with label and applicability', () => {
    const w = mount(SettingsAnnotationsView)
    const text = w.text()
    expect(text).toContain('Well-known annotations')
    for (const def of WELL_KNOWN_ANNOTATIONS) {
      expect(text).toContain(`emeland.io/${def.suffix}`)
      expect(text).toContain(def.label)
      expect(text).toContain(def.category)
    }
  })
})
