import { describe, it, expect } from 'vitest'
import { buildSystemGraph } from '@/graph/systemGraph'
import type { System, SystemInstance } from '@/types/system'

function sys(systemId: string, over: Partial<System> = {}): System {
  return { systemId, displayName: systemId, annotations: {}, ...over }
}

function inst(systemInstanceId: string, over: Partial<SystemInstance> = {}): SystemInstance {
  return { systemInstanceId, displayName: systemInstanceId, annotations: {}, ...over }
}

describe('buildSystemGraph', () => {
  it('creates a node per system with the raw (unprefixed) id', () => {
    const g = buildSystemGraph({ systems: [sys('s1'), sys('s2', { abstract: true })] })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['s1', 's2'])
    expect(g.nodes.every((n) => n.kind === 'system')).toBe(true)
    expect(g.nodes.find((n) => n.id === 's2')!.data).toMatchObject({ abstract: true })
  })

  it('links parents to children with sub: edges, skipping missing parents', () => {
    const g = buildSystemGraph({
      systems: [sys('root'), sys('child', { parent: 'root' }), sys('orphan', { parent: 'nope' })],
    })
    expect(g.edges).toEqual([
      { id: 'sub:root:child', source: 'root', target: 'child', kind: 'contains' },
    ])
  })

  it('attaches findings, version and instance refs with unresolved flags', () => {
    const g = buildSystemGraph({
      systems: [sys('s1', { version: { version: '1.2.3' } })],
      findingCountOf: () => 2,
      findingKindsOf: () => ['SomeKind'],
      instancesOf: () => [inst('b'), inst('a')],
      instanceUnresolved: (i) => i.systemInstanceId === 'b',
    })
    const data = g.nodes[0].data
    expect(data).toMatchObject({ version: '1.2.3', findings: 2, findingKinds: ['SomeKind'] })
    // instanceNames keep the input order (sorting happens in the tooltip)
    expect(
      (data as { instanceNames: { name: string; unresolved?: boolean }[] }).instanceNames,
    ).toEqual([{ name: 'b', unresolved: true }, { name: 'a' }])
  })

  it('omits instanceNames and zero findings', () => {
    const g = buildSystemGraph({ systems: [sys('s1')], findingCountOf: () => 0 })
    const data = g.nodes[0].data as { findings?: number; instanceNames?: unknown }
    expect(data.findings).toBeUndefined()
    expect(data.instanceNames).toBeUndefined()
  })

  it('lays out nodes with finite positions', () => {
    const g = buildSystemGraph({ systems: [sys('root'), sys('child', { parent: 'root' })] })
    for (const n of g.nodes) {
      expect(Number.isFinite(n.position.x)).toBe(true)
      expect(Number.isFinite(n.position.y)).toBe(true)
    }
  })
})
