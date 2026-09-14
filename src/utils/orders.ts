import type { Order } from '@/types/order'

/** Fulfillment state of an order, derived from its items' system instances */
export type OrderStatus = 'Open' | 'Partial' | 'Fulfilled'

export function fulfilledItemCount(order: Order): number {
  return order.items.filter((i) => i.systemInstance).length
}

export function orderStatus(order: Order): OrderStatus {
  const fulfilled = fulfilledItemCount(order)
  if (fulfilled === 0) return 'Open'
  return fulfilled === order.items.length ? 'Fulfilled' : 'Partial'
}

/** compact status line for graph sheets / dense UI */
export function orderStatusLabel(order: Order): string {
  const fulfilled = fulfilledItemCount(order)
  const total = order.items.length
  if (fulfilled === 0) return 'OPEN'
  if (fulfilled === total) return 'FULFILLED'
  return `${fulfilled}/${total} fulfilled`
}
