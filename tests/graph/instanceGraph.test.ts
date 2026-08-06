import { describe, it, expect } from 'vitest'
import { buildInstanceGraph } from '@/graph/instanceGraph'
import type { System, SystemInstance } from '@/types/system'

function sys(systemId: string, over: Partial<System> = {}): System {
  return {
    systemId,
    displayName: systemId,
    version: { version: '' },
    abstract: false,
    annotations: {},
    ...over,
  }
}

function inst(systemInstanceId: string, over: Partial<SystemInstance> = {}): SystemInstance {
  return { systemInstanceId, displayName: systemInstanceId, system: '', annotations: {}, ...over }
}

describe('buildInstanceGraph unmapped layout', () => {
  it('floats unmapped instances to the top of their frame, aligned across columns', () => {
    const g = buildInstanceGraph({
      systems: [sys('s1')],
      instancesOf: (id) => (id === 's1' ? [inst('m1', { system: 's1', context: 'ctxA' })] : []),
      contextName: (id) => id,
      unmappedInstances: [inst('u1', { context: 'ctxA' }), inst('u2', { context: 'ctxB' })],
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    const u1 = byId.get('u1')!
    const u2 = byId.get('u2')!
    const m1 = byId.get('m1')!

    expect((u1.data as { unmapped?: boolean }).unmapped).toBe(true)
    // the two unmapped instances live in different context frames (columns)...
    expect(u1.parentId).not.toBe(u2.parentId)
    // ...yet share the same top row instead of staggering by a row
    expect(u1.position.y).toBe(u2.position.y)
    // and the mapped instance is pushed below the reserved float zone
    expect(m1.position.y).toBeGreaterThan(u1.position.y)
  })

  it('leaves the layout unchanged when there are no unmapped instances', () => {
    const g = buildInstanceGraph({
      systems: [sys('s1')],
      instancesOf: (id) => (id === 's1' ? [inst('m1', { system: 's1', context: 'ctxA' })] : []),
      contextName: (id) => id,
      unmappedInstances: [],
    })
    const m1 = g.nodes.find((n) => n.id === 'm1')!
    // no float zone reserved, so the mapped instance sits on the first content row
    expect(m1.position.y).toBe(g.nodes.find((n) => n.id === 's1')!.position.y)
  })
})
