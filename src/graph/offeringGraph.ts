import type { Capability } from '@/types/capability'
import type { Order } from '@/types/order'
import type { SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode as DagNodeSpec } from './layoutDag'
import { prefixedId } from './ids'
import { findingData } from './helpers'
import { capabilityLifecycle, latestVersionRef } from '@/utils/version'
import { orderStatus, orderStatusLabel } from '@/utils/orders'

export interface OfferingGraphInput {
  capabilities: Capability[]
  orders: Order[]
  findingCountOf?: (resourceId: string) => number
  findingKindsOf?: (resourceId: string) => string[]
  /** resolve an order item's fulfilling instance */
  systemInstanceOf?: (systemInstanceId: string) => SystemInstance | undefined
  /** display name of the instance's system, for the fulfillment sub-line */
  systemName?: (systemId: string) => string | undefined
  /** show the fulfillment layer (instance nodes) */
  showFulfillment?: boolean
}

const ORDER_WIDTH = 180
const ORDER_PAD_Y = 16
const ORDER_STATUS_H = 14
const ORDER_TITLE_LINE_H = 18
const ORDER_FOOTER_H = 16
const ORDER_GAPS = 8
/** approx. chars that fit in the sheet title column at body size */
const ORDER_CHARS_PER_LINE = 18

function orderNodeHeight(label: string): number {
  const lines = Math.max(1, Math.ceil(label.length / ORDER_CHARS_PER_LINE))
  return ORDER_PAD_Y + ORDER_STATUS_H + lines * ORDER_TITLE_LINE_H + ORDER_FOOTER_H + ORDER_GAPS
}

export function buildOfferingGraph({
  capabilities,
  orders,
  findingCountOf,
  findingKindsOf,
  systemInstanceOf,
  systemName,
  showFulfillment = true,
}: OfferingGraphInput): GraphModel {
  const presentCapabilities = new Set(capabilities.map((c) => c.capabilityId))
  const capabilityById = new Map(capabilities.map((c) => [c.capabilityId, c]))

  const orderCountOf = (capabilityId: string) =>
    orders.filter((o) => o.items.some((i) => i.capability === capabilityId)).length

  // only pinned versions: an unpinned item ordered no particular version,
  // so the tooltip must not imply one (OrderDetail behaves the same)
  const versionOf = (capabilityId: string, capabilityVersionId?: string) => {
    if (!capabilityVersionId) return undefined
    return capabilityById
      .get(capabilityId)
      ?.versions?.find((v) => v.capabilityVersionId === capabilityVersionId)?.version?.version
  }

  const nodes: DagNodeSpec[] = capabilities.map((c) => ({
    id: prefixedId('capability', c.capabilityId),
    kind: 'capability' as const,
    data: {
      label: c.displayName,
      description: c.description || undefined,
      version: latestVersionRef(c.versions)?.version?.version,
      lifecycle: capabilityLifecycle(c.versions),
      orders: orderCountOf(c.capabilityId) || undefined,
      ...findingData(c.capabilityId, findingCountOf, findingKindsOf),
    },
  }))
  const edges: GraphEdge[] = []

  for (const o of orders) {
    const orderItems = o.items.map((i) => {
      const cap = capabilityById.get(i.capability)
      return {
        label: cap?.displayName ?? i.capability,
        fulfilled: !!i.systemInstance,
        description: cap?.description || undefined,
        version: versionOf(i.capability, i.capabilityVersion),
      }
    })
    nodes.push({
      id: prefixedId('order', o.orderId),
      kind: 'order',
      size: { width: ORDER_WIDTH, height: orderNodeHeight(o.displayName) },
      data: {
        label: o.displayName,
        description: o.description || undefined,
        status: orderStatus(o),
        statusLabel: orderStatusLabel(o),
        orderedAt: o.orderedAt,
        items: o.items.length,
        orderItems,
        ...findingData(o.orderId, findingCountOf, findingKindsOf),
      },
    })

    // one ordering edge per (capability, order) pair, however many items repeat it
    const orderedCapabilities = new Set(
      o.items.map((i) => i.capability).filter((id) => presentCapabilities.has(id)),
    )
    for (const capabilityId of orderedCapabilities) {
      edges.push({
        id: `orders:${o.orderId}:${capabilityId}`,
        source: prefixedId('capability', capabilityId),
        target: prefixedId('order', o.orderId),
        kind: 'consumes',
      })
    }

    if (!showFulfillment) continue
    for (const item of o.items) {
      if (!item.systemInstance) continue
      const inst = systemInstanceOf?.(item.systemInstance)
      const instId = prefixedId('instance', item.systemInstance)
      if (!nodes.some((n) => n.id === instId)) {
        nodes.push({
          id: instId,
          kind: 'instance',
          data: {
            label: inst?.displayName ?? item.systemInstance,
            system: inst?.system ? systemName?.(inst.system) : undefined,
            type: 'SystemInstance',
            unresolved: inst ? undefined : true,
          },
        })
      }
      edges.push({
        id: `fulfills:${item.orderItemId}`,
        source: prefixedId('order', o.orderId),
        target: instId,
        kind: 'provides',
      })
    }
  }

  return layoutDag({ nodes, edges, direction: 'LR' })
}
