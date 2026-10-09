import type { Annotations, UUID } from './common'

export interface BoundValue {
  parameterId: UUID
  value: string
  validValueId?: UUID
}

export interface OrderItem {
  orderItemId: UUID
  /** capability being ordered */
  capability: UUID
  displayName?: string
  description?: string
  capabilityVersion?: UUID
  variant?: UUID
  contexts?: UUID[]
  boundValues?: BoundValue[]
  /**
   * Fulfilling system instance, joined from SystemInstance.orderItem
   * (modelsrv links fulfillment on the instance, not the order item).
   */
  systemInstance?: UUID
  annotations: Annotations
}

export interface Order {
  orderId: UUID
  displayName: string
  description?: string
  orgUnit?: UUID
  orderedAt?: string
  items: OrderItem[]
  annotations: Annotations
}
