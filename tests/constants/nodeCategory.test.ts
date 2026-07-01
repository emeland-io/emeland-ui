import { describe, it, expect } from 'vitest'
import type { Node } from '@/types/node'
import {
  categoryFromName,
  resolveNodeCategory,
  categoryColor,
  categoryColorForNode,
  categoryColorForName,
  DEFAULT_CATEGORY_COLOR,
  type NodeCategory,
} from '@/constants/nodeCategory' 

function node(typeDisplayName: string | undefined, over: Partial<Node> = {}): Node {
  return {
    nodeId: '00000000-0000-4000-8000-000000000000',
    displayName: 'some-node',
    annotations: {},
    nodeType:
      typeDisplayName === undefined
        ? undefined
        : { nodeTypeId: 'tid', displayName: typeDisplayName },
    ...over,
  }
}

describe('categoryFromName', () => {
  it('matches the exact canonical categories', () => {
    expect(categoryFromName('Sensor')).toBe('Sensor')
    expect(categoryFromName('Filter')).toBe('Filter')
    expect(categoryFromName('Injector')).toBe('Injector')
    expect(categoryFromName('External')).toBe('External')
  })

  it('matches variants as a substring (the git-sensor case)', () => {
    expect(categoryFromName('git-sensor')).toBe('Sensor')
    expect(categoryFromName('file-sensor')).toBe('Sensor')
    expect(categoryFromName('k8s-sensor')).toBe('Sensor')
    expect(categoryFromName('kafka-injector')).toBe('Injector')
    expect(categoryFromName('db-filter')).toBe('Filter')
    expect(categoryFromName('external-api')).toBe('External')
  })

  it('is case-insensitive', () => {
    expect(categoryFromName('GIT-SENSOR')).toBe('Sensor')
    expect(categoryFromName('SENSOR')).toBe('Sensor')
    expect(categoryFromName('Injector')).toBe('Injector')
  })

  it('is order-deterministic (first pattern wins)', () => {
    expect(categoryFromName('sensor-injector')).toBe('Sensor')
    expect(categoryFromName('injector-sensor')).toBe('Sensor')
  })

  it('returns null for empty / missing / non-matching names', () => {
    expect(categoryFromName('')).toBeNull()
    expect(categoryFromName(undefined)).toBeNull()
    expect(categoryFromName(null)).toBeNull()
    expect(categoryFromName('foobar')).toBeNull()
    expect(categoryFromName('git-source')).toBeNull()
  })
})

describe('resolveNodeCategory', () => {
  it('resolves from the node type display name', () => {
    expect(resolveNodeCategory(node('Sensor'))).toBe('Sensor')
    expect(resolveNodeCategory(node('git-sensor'))).toBe('Sensor')
    expect(resolveNodeCategory(node('file-sensor'))).toBe('Sensor')
    expect(resolveNodeCategory(node('k8s-sensor'))).toBe('Sensor')
    expect(resolveNodeCategory(node('External'))).toBe('External')
  })

  it('returns null for an empty or missing node type (unknown state)', () => {
    expect(resolveNodeCategory(node(''))).toBeNull()
    expect(resolveNodeCategory(node(undefined))).toBeNull()
  })

  it('ignores the node own display name (category comes from the type)', () => {
    const n = node('', { displayName: 'git-sensor' })
    expect(resolveNodeCategory(n)).toBeNull()
  })
})

describe('categoryColor', () => {
  it('maps each category to its colour classes', () => {
    const expected: Record<NodeCategory, string> = {
      Sensor: 'bg-node-sensor/10 text-node-sensor',
      Filter: 'bg-node-filter/10 text-node-filter',
      Injector: 'bg-node-injector/10 text-node-injector',
      External: 'bg-node-external/10 text-node-external',
    }
    for (const [cat, cls] of Object.entries(expected)) {
      expect(categoryColor(cat as NodeCategory)).toBe(cls)
    }
  })

  it('falls back to the default colour for null', () => {
    expect(categoryColor(null)).toBe(DEFAULT_CATEGORY_COLOR)
  })
})

describe('categoryColorForNode', () => {
  it('colours a node from its type (variant -> Sensor blue)', () => {
    expect(categoryColorForNode(node('git-sensor'))).toBe('bg-node-sensor/10 text-node-sensor')
  })

  it('uses the neutral default for an empty/missing type', () => {
    expect(categoryColorForNode(node(''))).toBe(DEFAULT_CATEGORY_COLOR)
    expect(categoryColorForNode(node(undefined))).toBe(DEFAULT_CATEGORY_COLOR)
  })
})

describe('categoryColorForName', () => {
  it('colours straight from a raw display name (drawer case)', () => {
    expect(categoryColorForName('k8s-sensor')).toBe('bg-node-sensor/10 text-node-sensor')
    expect(categoryColorForName('External')).toBe('bg-node-external/10 text-node-external')
  })

  it('uses the neutral default for empty / non-matching', () => {
    expect(categoryColorForName('')).toBe(DEFAULT_CATEGORY_COLOR)
    expect(categoryColorForName('foobar')).toBe(DEFAULT_CATEGORY_COLOR)
  })
})

describe('real API node data', () => {
  const cases: [string, string, NodeCategory | null][] = [
    ['Sensor System B', 'Sensor', 'Sensor'],
    ['Filter Format Y', 'Filter', 'Filter'],
    ['Injector Target 1', 'Injector', 'Injector'],
    ['External System C', 'External', 'External'],
    ['test-git-sensor', '', null],
    ['Sensor System A', 'Sensor', 'Sensor'],
    ['git-sensor', '', null],
    ['local-filesensor', 'file-sensor', 'Sensor'],
    ['prod-k8s-sensor', 'k8s-sensor', 'Sensor'],
    ['orphan-git-sensor', '', null],
    ['prod-git-sensor', 'git-sensor', 'Sensor'],
  ]

  it.each(cases)('%s (type=%s) -> %s', (_name, typeName, expected) => {
    expect(resolveNodeCategory(node(typeName))).toBe(expected)
  })
})