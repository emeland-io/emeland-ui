import { API } from '@/constants/api'
import type { BoundValue, Order, OrderItem } from '@/types/order'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'
import { loadLandscapeDetails } from './landscapeLoad'
import { fetchValidValues, type ValidValueRow } from './capabilityGraph'
import type {
  BoundValue as BoundValueWireGen,
  Order as OrderWireGen,
  OrderItem as OrderItemWireGen,
} from './gen/types.gen'
import { zBoundValue, zOrder, zOrderItem, zSystemInstance } from './gen/zod.gen'

export type OrderWire = OrderWireGen & { description?: string; orderedAt?: string }
export type OrderItemWire = OrderItemWireGen & { description?: string }
export type BoundValueWire = BoundValueWireGen

// pass unknown keys through instead of zod's default strip, so the
// frontend-first fields survive response validation
const zOrderResponse = zOrder.passthrough()

function str(raw: Record<string, unknown>, key: string): string | undefined {
  const v = raw[key]
  return typeof v === 'string' && v ? v : undefined
}

function strs(raw: Record<string, unknown>, key: string): string[] {
  if (!Array.isArray(raw[key])) return []
  return raw[key].filter((c): c is string => typeof c === 'string' && c.length > 0)
}

type BoundValueRow = BoundValue & { orderItem: string; validValueId: string }
type OrderItemRow = OrderItem & { order: string }

function decodeBoundValueRow(raw: Record<string, unknown>): BoundValueRow {
  const orderItem = str(raw, 'orderItem')
  const parameterId = str(raw, 'parameter')
  const validValueId = str(raw, 'validValue')
  if (!orderItem || !parameterId || !validValueId) {
    throw new Error('BoundValue missing orderItem, parameter or validValue')
  }
  return {
    orderItem,
    parameterId,
    validValueId,
    value: str(raw, 'displayName') ?? '',
  }
}

function decodeOrderItemRow(raw: Record<string, unknown>): OrderItemRow {
  const orderItemId = responseId(raw, 'orderItemId')
  const order = str(raw, 'order')
  const capability = str(raw, 'capability')
  const capabilityVersion = str(raw, 'capabilityVersion')
  const variant = str(raw, 'variant')
  if (!orderItemId || !order || !capability || !capabilityVersion || !variant) {
    throw new Error('OrderItem missing required fields')
  }
  const displayName = str(raw, 'displayName')
  const description = str(raw, 'description')
  const contexts = strs(raw, 'contexts')
  return {
    orderItemId,
    order,
    capability,
    capabilityVersion,
    variant,
    ...(displayName ? { displayName } : {}),
    ...(description ? { description } : {}),
    ...(contexts.length ? { contexts } : {}),
    annotations: decodeAnnotations(raw.annotations as AnnotationsResponse | undefined),
  }
}

function decodeOrder(res: OrderWire): Order {
  return {
    orderId: res.orderId,
    displayName: res.displayName,
    ...(res.description ? { description: res.description } : {}),
    ...(res.orgUnit ? { orgUnit: res.orgUnit } : {}),
    ...(res.orderedAt ? { orderedAt: res.orderedAt } : {}),
    // joined from OrderItem / BoundValue / SystemInstance in withItems
    items: [],
    annotations: decodeAnnotations(res.annotations),
  }
}

const orders = makeResourceApi<Order, OrderWire>({
  name: 'Order',
  namePlural: 'orders',
  listPath: API.ORDERS.list,
  byIdPath: API.ORDERS.byId,
  mocks: async () => (await import('@/mocks/orders')).orders,
  idKey: 'orderId',
  idOf: (o) => o.orderId,
  fullList: true,
  responseSchema: zOrderResponse,
  decode: decodeOrder,
})

type OrderJoin = {
  items: OrderItemRow[]
  boundValues: BoundValueRow[]
  validValues: ValidValueRow[]
  fulfillment: Map<string, string>
}

type FulfillmentRow = { systemInstanceId: string; orderItem?: string }

function decodeFulfillmentRow(raw: Record<string, unknown>): FulfillmentRow {
  const systemInstanceId = responseId(raw, 'systemInstanceId')
  if (!systemInstanceId) throw new Error('SystemInstance missing id')
  const orderItem = str(raw, 'orderItem')
  return { systemInstanceId, ...(orderItem ? { orderItem } : {}) }
}

async function loadOrderJoin(): Promise<OrderJoin> {
  const [items, boundValues, validValues, instances] = await Promise.all([
    loadLandscapeDetails({
      namePlural: 'order items',
      paths: API.ORDER_ITEMS,
      mocks: async () => (await import('@/mocks/orderItems')).orderItems,
      idKey: 'orderItemId',
      schema: zOrderItem,
      decode: decodeOrderItemRow,
    }),
    loadLandscapeDetails({
      namePlural: 'bound values',
      paths: API.BOUND_VALUES,
      mocks: async () => (await import('@/mocks/boundValues')).boundValues,
      idKey: 'boundValueId',
      schema: zBoundValue,
      decode: decodeBoundValueRow,
    }),
    fetchValidValues(),
    // SystemInstance is InstanceList (not FullListResponse): expand via byId so
    // orderItem is present. Soft-fails with the other joins on 404/501
    loadLandscapeDetails({
      namePlural: 'system instances',
      paths: API.SYSTEM_INSTANCES,
      mocks: async () => (await import('@/mocks/systems')).systemInstances,
      idKey: 'systemInstanceId',
      schema: zSystemInstance,
      decode: decodeFulfillmentRow,
    }),
  ])
  const fulfillment = new Map<string, string>()
  for (const inst of instances) {
    if (inst.orderItem) fulfillment.set(inst.orderItem, inst.systemInstanceId)
  }
  return { items, boundValues, validValues, fulfillment }
}

/**
 * Nest flat OrderItem / BoundValue resources under their orders, resolve bound
 * value display names via ValidValue, and attach fulfillment from
 * SystemInstance.orderItem (the modelsrv link direction).
 */
function withItems(list: Order[], join: OrderJoin): Order[] {
  const vvById = new Map(join.validValues.map((v) => [v.validValueId, v]))
  const boundByItem = new Map<string, BoundValue[]>()
  for (const { orderItem, ...bv } of join.boundValues) {
    const value = vvById.get(bv.validValueId)?.displayName || bv.value
    const bucket = boundByItem.get(orderItem) ?? []
    bucket.push({ ...bv, value })
    boundByItem.set(orderItem, bucket)
  }
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const { order, ...item } of join.items) {
    const boundValues = boundByItem.get(item.orderItemId)
    const systemInstance = join.fulfillment.get(item.orderItemId)
    const bucket = itemsByOrder.get(order) ?? []
    bucket.push({
      ...item,
      ...(boundValues?.length ? { boundValues } : {}),
      ...(systemInstance ? { systemInstance } : {}),
    })
    itemsByOrder.set(order, bucket)
  }
  return list.map((o) => ({ ...o, items: itemsByOrder.get(o.orderId) ?? [] }))
}

export async function fetchOrders(): Promise<Order[]> {
  const [list, join] = await Promise.all([orders.fetchAll(), loadOrderJoin()])
  return withItems(list, join)
}

export async function fetchOrderById(id: string): Promise<Order> {
  const [order, join] = await Promise.all([orders.fetchById(id), loadOrderJoin()])
  return withItems([order], join)[0]!
}
