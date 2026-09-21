import { describe, it, expect } from 'vitest'
import { buildOfferingGraph } from '@/graph/offeringGraph'
import type { Capability } from '@/types/capability'
import type { Order, OrderItem } from '@/types/order'
import type { SystemInstance } from '@/types/system'

function cap(capabilityId: string, over: Partial<Capability> = {}): Capability {
  return { capabilityId, displayName: capabilityId, annotations: {}, ...over }
}

function item(orderItemId: string, capability: string, over: Partial<OrderItem> = {}): OrderItem {
  return { orderItemId, capability, annotations: {}, ...over }
}

function order(orderId: string, items: OrderItem[], over: Partial<Order> = {}): Order {
  return { orderId, displayName: orderId, items, annotations: {}, ...over }
}

const INSTANCES = new Map<string, SystemInstance>([
  ['si1', { systemInstanceId: 'si1', displayName: 'App (prod)', system: 'sys1', annotations: {} }],
])

describe('buildOfferingGraph', () => {
  it('creates prefixed capability and order nodes', () => {
    const g = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'c1')])],
    })
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['cap:c1', 'ord:o1'])
    expect(g.edges).toEqual([
      { id: 'orders:o1:c1', source: 'cap:c1', target: 'ord:o1', kind: 'consumes' },
    ])
  })

  it('collapses repeated items of the same capability into one ordering edge', () => {
    const g = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'c1'), item('i2', 'c1')])],
    })
    expect(g.edges.filter((e) => e.kind === 'consumes')).toHaveLength(1)
  })

  it('skips ordering edges to capabilities that are not shown', () => {
    const g = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'other')])],
    })
    expect(g.edges).toEqual([])
  })

  it('adds fulfillment instance nodes with resolved system names', () => {
    const g = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'c1', { systemInstance: 'si1' })])],
      systemInstanceOf: (id) => INSTANCES.get(id),
      systemName: (id) => (id === 'sys1' ? 'Application' : undefined),
    })
    const inst = g.nodes.find((n) => n.id === 'inst:si1')
    expect(inst?.kind).toBe('instance')
    expect(inst?.data).toMatchObject({ label: 'App (prod)', system: 'Application' })
    expect(g.edges).toContainEqual({
      id: 'fulfills:i1',
      source: 'ord:o1',
      target: 'inst:si1',
      kind: 'provides',
    })
  })

  it('shares one instance node between orders fulfilled by the same instance', () => {
    const g = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [
        order('o1', [item('i1', 'c1', { systemInstance: 'si1' })]),
        order('o2', [item('i2', 'c1', { systemInstance: 'si1' })]),
      ],
      systemInstanceOf: (id) => INSTANCES.get(id),
    })
    expect(g.nodes.filter((n) => n.id === 'inst:si1')).toHaveLength(1)
    expect(g.edges.filter((e) => e.kind === 'provides')).toHaveLength(2)
  })

  it('marks unresolvable instances and omits the layer when fulfillment is off', () => {
    const withLayer = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'c1', { systemInstance: 'ghost' })])],
    })
    const ghost = withLayer.nodes.find((n) => n.id === 'inst:ghost')
    expect(ghost?.data).toMatchObject({ unresolved: true })

    const without = buildOfferingGraph({
      capabilities: [cap('c1')],
      orders: [order('o1', [item('i1', 'c1', { systemInstance: 'ghost' })])],
      showFulfillment: false,
    })
    expect(without.nodes.some((n) => n.kind === 'instance')).toBe(false)
  })

  it('annotates capability nodes with lifecycle, latest version and order count', () => {
    const g = buildOfferingGraph({
      capabilities: [
        cap('c1', {
          description: 'Hosted metrics',
          versions: [
            {
              capabilityVersionId: 'v1',
              version: { version: '1.1.0', deprecatedFrom: '2020-01-01T00:00:00Z' },
            },
          ],
        }),
      ],
      orders: [order('o1', [item('i1', 'c1')])],
    })
    expect(g.nodes.find((n) => n.id === 'cap:c1')?.data).toMatchObject({
      description: 'Hosted metrics',
      version: '1.1.0',
      lifecycle: 'deprecated',
      orders: 1,
    })
  })

  it('annotates order nodes with status label and per-item fulfillment', () => {
    const g = buildOfferingGraph({
      capabilities: [
        cap('c1', { displayName: 'Metrics', description: 'Hosted metrics' }),
        cap('c2', {
          displayName: 'Logs',
          description: 'Central logging',
          versions: [{ capabilityVersionId: 'v2', version: { version: '2.0.0' } }],
        }),
      ],
      orders: [
        order('o1', [
          item('i1', 'c1', { systemInstance: 'si1' }),
          item('i2', 'c2', { capabilityVersion: 'v2' }),
          item('i3', 'c1'),
        ]),
      ],
      systemInstanceOf: (id) => INSTANCES.get(id),
    })
    expect(g.nodes.find((n) => n.id === 'ord:o1')?.data).toMatchObject({
      status: 'Partial',
      statusLabel: '1/3 fulfilled',
      orderItems: [
        { label: 'Metrics', fulfilled: true, description: 'Hosted metrics' },
        { label: 'Logs', fulfilled: false, description: 'Central logging', version: '2.0.0' },
        { label: 'Metrics', fulfilled: false, description: 'Hosted metrics' },
      ],
    })
  })
})
