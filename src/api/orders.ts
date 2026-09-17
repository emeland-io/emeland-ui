import { API } from '@/constants/api'
import { z } from 'zod'
import type { Order, OrderItem } from '@/types/order'
import { decodeAnnotations } from './decode'
import { makeResourceApi } from './resource'
import { annotationsResponseSchema } from './decode'
import { zInstanceListItem } from './gen/zod.gen'

const boundValueResponseSchema = z.object({
  parameterId: z.string().min(1),
  value: z.string(),
})

const orderItemResponseSchema = z.object({
  orderItemId: z.string().min(1),
  capability: z.string().min(1),
  displayName: z.string().optional(),
  description: z.string().optional(),
  capabilityVersion: z.string().min(1).optional(),
  boundValues: z.array(boundValueResponseSchema).optional(),
  systemInstance: z.string().min(1).optional(),
  annotations: annotationsResponseSchema.optional(),
})

const orderResponseSchema = z.object({
  orderId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  orgUnit: z.string().min(1).optional(),
  orderedAt: z.string().optional(),
  items: z.array(orderItemResponseSchema),
  annotations: annotationsResponseSchema.optional(),
})

export type OrderResponse = z.infer<typeof orderResponseSchema>
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>

function decodeOrderItem(res: OrderItemResponse): OrderItem {
  return {
    orderItemId: res.orderItemId,
    capability: res.capability,
    ...(res.displayName ? { displayName: res.displayName } : {}),
    ...(res.description ? { description: res.description } : {}),
    ...(res.capabilityVersion ? { capabilityVersion: res.capabilityVersion } : {}),
    ...(res.boundValues
      ? {
          boundValues: res.boundValues.map((bv) => ({
            parameterId: bv.parameterId,
            value: bv.value,
          })),
        }
      : {}),
    ...(res.systemInstance ? { systemInstance: res.systemInstance } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

function decodeOrder(res: OrderResponse): Order {
  return {
    orderId: res.orderId,
    displayName: res.displayName,
    ...(res.description ? { description: res.description } : {}),
    ...(res.orgUnit ? { orgUnit: res.orgUnit } : {}),
    ...(res.orderedAt ? { orderedAt: res.orderedAt } : {}),
    items: res.items.map(decodeOrderItem),
    annotations: decodeAnnotations(res.annotations),
  }
}

const orders = makeResourceApi<Order, OrderResponse>({
  name: 'Order',
  namePlural: 'orders',
  listPath: API.ORDERS.list,
  byIdPath: API.ORDERS.byId,
  mocks: async () => (await import('@/mocks/orders')).orders,
  idKey: 'orderId',
  idOf: (o) => o.orderId,
  listSchema: zInstanceListItem,
  requireListFields: ['instanceId', 'displayName'],
  responseSchema: orderResponseSchema,
  decode: decodeOrder,
})

export const fetchOrders = orders.fetchAll
export const fetchOrderById = orders.fetchById
