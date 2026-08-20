import { describe, it, expect } from 'vitest'
import { buildComponentGraph } from '@/graph/componentGraph'
import type { Component, ComponentInstance } from '@/types/component'

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

function inst(componentInstanceId: string, over: Partial<ComponentInstance> = {}): ComponentInstance {
  return { componentInstanceId, displayName: componentInstanceId, annotations: {}, ...over }
}

describe('buildComponentGraph', () => {
  it('creates a node per component, prefixed with comp:', () => {
    const g = buildComponentGraph({
      components: [comp('c1'), comp('c2')],
      apiName: () => undefined,
      showInstances: false,
    })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['comp:c1', 'comp:c2'])
    expect(g.nodes.every((n) => n.kind === 'component')).toBe(true)
    expect(g.edges).toEqual([])
  })

  it('creates shared api nodes and provides/consumes edges', () => {
    const g = buildComponentGraph({
      components: [comp('c1', { provides: ['a1'], consumes: ['a2'] }), comp('c2', { provides: ['a1'] })],
      apiName: (id) => `API ${id}`,
      showInstances: false,
    })
    // one node per referenced api, even when shared
    expect(g.nodes.filter((n) => n.kind === 'api').map((n) => n.id).sort()).toEqual([
      'api:a1',
      'api:a2',
    ])
    const edge = (id: string) => g.edges.find((e) => e.id === id)
    expect(edge('prov:c1:a1')).toMatchObject({ source: 'comp:c1', target: 'api:a1', kind: 'provides' })
    expect(edge('prov:c2:a1')).toMatchObject({ source: 'comp:c2', target: 'api:a1', kind: 'provides' })
    expect(edge('cons:a2:c1')).toMatchObject({ source: 'api:a2', target: 'comp:c1', kind: 'consumes' })
    expect(g.edges).toHaveLength(3)
    // api nodes carry the resolved label
    expect(g.nodes.find((n) => n.id === 'api:a1')!.data).toMatchObject({ label: 'API a1' })
  })

  it('collapses apis into via: links when showApis is off, deduped and without self-loops', () => {
    const g = buildComponentGraph({
      components: [
        comp('c1', { provides: ['a1', 'a1'], consumes: ['a1'] }), // duplicate listing, self-loop
        comp('c2', { provides: ['a2'] }),
        comp('c3', { consumes: ['a1', 'a1', 'a2'] }), // duplicate consume
      ],
      apiName: () => undefined,
      showInstances: false,
      showApis: false,
    })
    expect(g.nodes.some((n) => n.kind === 'api')).toBe(false)
    // c1 consuming its own a1 is skipped; duplicate provides/consumes produce one edge
    expect(g.edges.map((e) => e.id).sort()).toEqual(['via:c1->c3', 'via:c2->c3'])
    expect(g.edges.every((e) => e.kind === 'communicates')).toBe(true)
  })

  it('attaches findings and instance refs with unresolved flags', () => {
    const g = buildComponentGraph({
      components: [comp('c1'), comp('c2')],
      apiName: () => undefined,
      showInstances: false,
      findingCountOf: (id) => (id === 'c1' ? 3 : 0),
      findingKindsOf: (id) => (id === 'c1' ? ['SomeKind'] : []),
      instancesOf: (id) => (id === 'c1' ? [inst('i1'), inst('i2')] : []),
      instanceUnresolved: (i) => i.componentInstanceId === 'i2',
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    expect(byId.get('comp:c1')!.data).toMatchObject({
      findings: 3,
      findingKinds: ['SomeKind'],
      instanceNames: [{ name: 'i1' }, { name: 'i2', unresolved: true }],
    })
    const c2 = byId.get('comp:c2')!.data as { findings?: number; instanceNames?: unknown }
    expect(c2.findings).toBeUndefined()
    expect(c2.instanceNames).toBeUndefined()
  })

  it('creates instance nodes with has: edges when showInstances is on', () => {
    const g = buildComponentGraph({
      components: [comp('c1')],
      apiName: () => undefined,
      showInstances: true,
      instancesOf: () => [inst('i1', { component: 'c1' })],
      unmappedInstances: [inst('i2', { component: 'missing' })],
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    expect(byId.get('inst:i1')).toMatchObject({ kind: 'instance' })
    expect(byId.get('inst:i1')!.data).toMatchObject({ parent: 'comp:c1', type: 'ComponentInstance' })
    // unmapped instance: no parent edge, flagged; a dangling component ref marks it unresolved
    expect(byId.get('inst:i2')!.data).toMatchObject({ unmapped: true, unresolved: true })
    expect(g.edges.map((e) => e.id)).toEqual(['has:c1:i1'])
  })

  it('lays out nodes with finite positions', () => {
    const g = buildComponentGraph({
      components: [comp('c1', { provides: ['a1'] }), comp('c2', { consumes: ['a1'] })],
      apiName: () => undefined,
      showInstances: false,
    })
    for (const n of g.nodes) {
      expect(Number.isFinite(n.position.x)).toBe(true)
      expect(Number.isFinite(n.position.y)).toBe(true)
    }
  })
})
