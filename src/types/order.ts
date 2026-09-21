import type { Annotations, UUID } from './common'

export interface BoundValue {
  parameterId: UUID
  value: string
}

export interface OrderItem {
  orderItemId: UUID
  /** capability being ordered */
  capability: UUID
  displayName?: string
  description?: string
  capabilityVersion?: UUID
  boundValues?: BoundValue[]
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
