import { describe, it, expect } from 'vitest'
import { buildContextGraph } from '@/graph/contextGraph'
import type { Context } from '@/types/context'
import type { SystemInstance } from '@/types/system'

function ctx(contextId: string, over: Partial<Context> = {}): Context {
  return { contextId, displayName: contextId, annotations: {}, ...over }
}

function inst(systemInstanceId: string, over: Partial<SystemInstance> = {}): SystemInstance {
  return { systemInstanceId, displayName: systemInstanceId, annotations: {}, ...over }
}

const typeName = (c: Context) => c.contextTypeId ?? 'Unknown'

describe('buildContextGraph', () => {
  it('creates a context-node per context with the raw id', () => {
    const g = buildContextGraph({ contexts: [ctx('x1'), ctx('x2')], typeName })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['x1', 'x2'])
    expect(g.nodes.every((n) => n.kind === 'context-node')).toBe(true)
    expect(g.edges).toEqual([])
  })

  it('links parents with sub: edges and orders parents before children', () => {
    const g = buildContextGraph({
      // input order deliberately scrambled
      contexts: [ctx('grand', { parentId: 'root' }), ctx('child', { parentId: 'grand' }), ctx('root')],
      typeName,
    })
    expect(g.edges).toEqual([
      { id: 'sub:root:grand', source: 'root', target: 'grand', kind: 'contains' },
      { id: 'sub:grand:child', source: 'grand', target: 'child', kind: 'contains' },
    ])
    const indexOf = (id: string) => g.nodes.findIndex((n) => n.id === id)
    expect(indexOf('root')).toBeLessThan(indexOf('grand'))
    expect(indexOf('grand')).toBeLessThan(indexOf('child'))
  })

  it('skips edges to missing parents and treats such contexts as roots', () => {
    const g = buildContextGraph({ contexts: [ctx('orphan', { parentId: 'nope' })], typeName })
    expect(g.edges).toEqual([])
    expect(g.nodes.map((n) => n.id)).toEqual(['orphan'])
  })

  it('attaches type, instance counts and sorted instance refs with unresolved flags', () => {
    const g = buildContextGraph({
      contexts: [ctx('x1', { contextTypeId: 'Environment' })],
      typeName,
      instanceCountOf: () => 2,
      instancesIn: () => [inst('b'), inst('a')],
      instanceUnresolved: (i) => i.systemInstanceId === 'a',
      findingCountOf: () => 1,
      findingKindsOf: () => ['SomeKind'],
    })
    expect(g.nodes[0].data).toMatchObject({
      type: 'Environment',
      instances: 2,
      findings: 1,
      findingKinds: ['SomeKind'],
    })
    // instance refs are sorted by name
    expect(
      (g.nodes[0].data as { instanceNames: { name: string; unresolved?: boolean }[] })
        .instanceNames,
    ).toEqual([{ name: 'a', unresolved: true }, { name: 'b' }])
  })

  it('omits zero counts and empty type names', () => {
    // the caller maps 'Unknown' to '' — the builder drops empty type names
    const g = buildContextGraph({
      contexts: [ctx('x1')],
      typeName: () => '',
      instanceCountOf: () => 0,
      findingCountOf: () => 0,
    })
    const data = g.nodes[0].data as Record<string, unknown>
    expect(data.type).toBeUndefined()
    expect(data.instances).toBeUndefined()
    expect(data.findings).toBeUndefined()
    expect(data.instanceNames).toBeUndefined()
  })

  it('lays out nodes with finite positions', () => {
    const g = buildContextGraph({
      contexts: [ctx('root'), ctx('child', { parentId: 'root' })],
      typeName,
    })
    for (const n of g.nodes) {
      expect(Number.isFinite(n.position.x)).toBe(true)
      expect(Number.isFinite(n.position.y)).toBe(true)
    }
  })
})
