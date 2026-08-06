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
  it('nests one frame per system reference inside the unmapped frame, before the graph', () => {
    const g = buildInstanceGraph({
      systems: [sys('s1')],
      instancesOf: (id) => (id === 's1' ? [inst('m1', { system: 's1', context: 'ctxA' })] : []),
      contextName: (id) => id,
      unmappedInstances: [
        inst('u1', { system: 'missing-b', context: 'ctxA' }),
        inst('u2', { system: 'missing-a', context: 'ctxB' }),
      ],
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    const u1 = byId.get('u1')!
    const u2 = byId.get('u2')!
    const m1 = byId.get('m1')!
    const frame = byId.get('frame:unmapped')!
    const innerA = byId.get('frame:unmapped:missing-a')!
    const innerB = byId.get('frame:unmapped:missing-b')!

    // one dashed unmapped frame holding the group frames...
    expect((frame.data as { variant?: string }).variant).toBe('unmapped')
    expect((frame.data as { count?: number }).count).toBe(2)
    // ...always before the context frames, and entirely before the graph
    // itself (left of the anchors), like the API/component graph lanes
    expect(frame.position.x).toBeLessThan(byId.get('ctxA')!.position.x)
    expect(frame.position.x + frame.size!.width).toBeLessThanOrEqual(byId.get('s1')!.position.x)
    // inner frames nest inside it, sorted by reference
    expect(innerA.parentId).toBe('frame:unmapped')
    expect(innerB.parentId).toBe('frame:unmapped')
    expect(innerA.position.x).toBeLessThan(innerB.position.x)
    // each instance parents to its group frame
    expect(u2.parentId).toBe('frame:unmapped:missing-a')
    expect(u1.parentId).toBe('frame:unmapped:missing-b')
    expect((u1.data as { unmapped?: boolean }).unmapped).toBe(true)

    // the unmapped frames size to their own content:
    // inner = 40 header + 1 node (56) + 12 pad, outer = 48 + inner + 14
    expect(innerA.size?.height).toBe(108)
    expect(frame.size?.height).toBe(170)
    // the context frame keeps the shared band height (one row here)
    expect(byId.get('ctxA')!.size?.height).toBe(48 + 56 + 14)

    // the mapped instance is unaffected: it sits on its first band row
    expect(m1.position.y).toBe(byId.get('s1')!.position.y)
    // no context frame is created for contexts only unmapped instances have
    expect(byId.has('ctxB')).toBe(false)
  })

  it('puts instances with no system reference in their own group frame, last', () => {
    const g = buildInstanceGraph({
      systems: [],
      instancesOf: () => [],
      contextName: (id) => id,
      unmappedInstances: [inst('u1'), inst('u2', { system: 'missing-a' })],
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    expect(byId.get('u1')!.parentId).toBe('frame:unmapped:none')
    expect(byId.get('u2')!.parentId).toBe('frame:unmapped:missing-a')
    expect((byId.get('frame:unmapped:none')!.data as { label?: string }).label).toBe(
      'No system reference',
    )
    expect(byId.get('frame:unmapped:missing-a')!.position.x).toBeLessThan(
      byId.get('frame:unmapped:none')!.position.x,
    )
  })

  it('flows a group frame into columns of at most 5 rows and widens the frames', () => {
    const unmappedInstances = Array.from({ length: 12 }, (_, i) =>
      inst(`u${String(i).padStart(2, '0')}`, { system: 'missing' }),
    )
    const g = buildInstanceGraph({
      systems: [],
      instancesOf: () => [],
      contextName: (id) => id,
      unmappedInstances,
    })
    const byId = new Map(g.nodes.map((n) => [n.id, n]))
    const first = byId.get('u00')!

    // first column: five rows, same x, one row pitch apart
    expect(byId.get('u04')!.position.x).toBe(first.position.x)
    expect(byId.get('u04')!.position.y).toBe(first.position.y + 4 * 72)

    // sixth instance wraps into the next column: back to the top row
    const sixth = byId.get('u05')!
    expect(sixth.position.y).toBe(first.position.y)
    expect(sixth.position.x).toBe(first.position.x + 216 + 16)

    // three columns for twelve instances; both frames widen to fit them
    expect(byId.get('u10')!.position.x).toBe(first.position.x + 2 * (216 + 16))
    expect(byId.get('frame:unmapped:missing')!.size?.width).toBe(2 * 12 + 3 * 216 + 2 * 16)
    expect(byId.get('frame:unmapped')!.size?.width).toBe(2 * 14 + (2 * 12 + 3 * 216 + 2 * 16))
  })

  it('leaves the layout unchanged when there are no unmapped instances', () => {
    const g = buildInstanceGraph({
      systems: [sys('s1')],
      instancesOf: (id) => (id === 's1' ? [inst('m1', { system: 's1', context: 'ctxA' })] : []),
      contextName: (id) => id,
      unmappedInstances: [],
    })
    expect(g.nodes.some((n) => n.id === 'frame:unmapped')).toBe(false)
    const m1 = g.nodes.find((n) => n.id === 'm1')!
    // no float zone reserved, so the mapped instance sits on the first content row
    expect(m1.position.y).toBe(g.nodes.find((n) => n.id === 's1')!.position.y)
  })
})
