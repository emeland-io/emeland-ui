import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { load as loadYaml } from 'js-yaml'
import { GENERATED_ANNOTATIONS } from '@/annotations/catalog.gen'

const YAML_PATH = 'src/annotations/well-known-annotations.yaml'

describe('annotations catalog YAML ↔ generated parity', () => {
  const yamls = () => loadYaml(readFileSync(YAML_PATH, 'utf8')) as {
    annotations: {
      key: string
      label: string
      purpose: string
      example: string
      appliesTo: string
      category: string
      level?: string
      format?: string
    }[]
  }

  it('every YAML entry is in the generated catalog', () => {
    const byKey = new Map(GENERATED_ANNOTATIONS.map((g) => [g.key, g]))
    for (const entry of yamls().annotations) {
      expect(byKey.has(entry.key), `missing ${entry.key}`).toBe(true)
      const g = byKey.get(entry.key)!
      expect(g.label).toBe(entry.label)
      expect(g.purpose).toBe(entry.purpose)
      expect(g.example).toBe(entry.example)
      expect(g.appliesTo).toBe(entry.appliesTo)
      expect(g.category).toBe(entry.category)
      expect(g.level).toBe(entry.level)
      expect(g.format).toBe(entry.format)
      expect(g.suffix).toBe(entry.key.replace(/^emeland\.io\//, ''))
    }
  })
})
