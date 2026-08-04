import { describe, it, expect } from 'vitest'
import { buildApiGraph } from '@/graph/apiGraph'
import type { Api } from '@/types/api'
import type { Component } from '@/types/component'

function api(apiId: string, over: Partial<Api> = {}): Api {
  return {
    apiId,
    displayName: apiId,
    version: { version: '' },
    type: 'OpenAPI',
    system: '',
    annotations: {},
    ...over,
  }
}

function comp(componentId: string, over: Partial<Component> = {}): Component {
  return {
    componentId,
    displayName: componentId,
    version: { version: '' },
    system: '',
    consumes: [],
    provides: [],
    annotations: {},
    ...over,
  }
}

describe('buildApiGraph', () => {
  const apis = [api('a1'), api('a2')]
  const components = [
    comp('c1', { provides: ['a1'], consumes: ['a2'] }),
    comp('c2', { consumes: ['a1'] }),
    comp('c3'), // touches no shown API
  ]

  it('creates a node per API, prefixed with api:', () => {
    const g = buildApiGraph({ apis, components: [] })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['api:a1', 'api:a2'])
    expect(g.nodes.every((n) => n.kind === 'api')).toBe(true)
    expect(g.edges).toEqual([])
  })

  it('links only components that provide or consume a shown API', () => {
    const g = buildApiGraph({ apis, components })
    const compIds = g.nodes.filter((n) => n.kind === 'component').map((n) => n.id)
    expect(compIds.sort()).toEqual(['comp:c1', 'comp:c2'])

    const edge = (id: string) => g.edges.find((e) => e.id === id)
    expect(edge('prov:c1:a1')).toMatchObject({ source: 'comp:c1', target: 'api:a1', kind: 'provides' })
    expect(edge('cons:a2:c1')).toMatchObject({ source: 'api:a2', target: 'comp:c1', kind: 'consumes' })
    expect(edge('cons:a1:c2')).toMatchObject({ source: 'api:a1', target: 'comp:c2', kind: 'consumes' })
    expect(g.edges).toHaveLength(3)
  })

  it('ignores component relations to APIs that are not shown', () => {
    const g = buildApiGraph({
      apis: [api('a1')],
      components: [comp('c1', { provides: ['a1', 'aX'], consumes: ['aY'] })],
    })
    expect(g.edges.map((e) => e.id)).toEqual(['prov:c1:a1'])
  })

  it('collapses components into direct API links when showComponents is off', () => {
    const g = buildApiGraph({ apis, components, showComponents: false })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['api:a1', 'api:a2'])
    // c1 consumes a2 and provides a1: a2 -> a1
    expect(g.edges).toHaveLength(1)
    expect(g.edges[0]).toMatchObject({
      id: 'via:a2->a1',
      source: 'api:a2',
      target: 'api:a1',
      kind: 'communicates',
    })
  })

  it('dedupes direct links and skips self-loops', () => {
    const g = buildApiGraph({
      apis: [api('a1'), api('a2')],
      components: [
        comp('c1', { provides: ['a1'], consumes: ['a1', 'a2'] }),
        comp('c2', { provides: ['a1'], consumes: ['a2'] }),
      ],
      showComponents: false,
    })
    expect(g.edges.map((e) => e.id)).toEqual(['via:a2->a1'])
  })

  it('marks crossing API nodes via crossesOf', () => {
    const g = buildApiGraph({ apis, components: [], crossesOf: (id) => id === 'a2' })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    expect((byId.get('api:a1')!.data as { crosses?: boolean }).crosses).toBeUndefined()
    expect((byId.get('api:a2')!.data as { crosses?: boolean }).crosses).toBe(true)
  })

  it('attaches findings to API nodes, omitting them when the count is zero', () => {
    const g = buildApiGraph({
      apis,
      components: [],
      findingCountOf: (id) => (id === 'a1' ? 2 : 0),
      findingKindsOf: (id) => (id === 'a1' ? ['MissingProvider'] : []),
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    expect(byId.get('api:a1')!.data).toMatchObject({ findings: 2, findingKinds: ['MissingProvider'] })
    const a2 = byId.get('api:a2')!.data as { findings?: number; findingKinds?: string[] }
    expect(a2.findings).toBeUndefined()
    expect(a2.findingKinds).toEqual([])
  })

  it('lays out nodes with positions', () => {
    const g = buildApiGraph({ apis, components })
    for (const n of g.nodes) {
      expect(Number.isFinite(n.position.x)).toBe(true)
      expect(Number.isFinite(n.position.y)).toBe(true)
    }
  })
})
