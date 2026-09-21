<script setup lang="ts">
import { useCapabilitiesStore } from '@/stores/capabilities'
import TypeTag from '@/components/TypeTag.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import { fulfilledItemCount, orderStatus, type OrderStatus } from '@/utils/orders'
import { pluralize } from '@/utils/text'
import type { Order } from '@/types/order'

defineProps<{
  orders: Order[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const capabilitiesStore = useCapabilitiesStore()

function statusTitle(o: Order): string {
  return `${fulfilledItemCount(o)} of ${o.items.length} items fulfilled by a system instance`
}

function capabilitySummary(order: Order): string {
  const names = order.items.map(
    (i) => capabilitiesStore.capabilityMap.get(i.capability)?.displayName ?? i.capability,
  )
  if (names.length <= 3) return names.join(' · ')
  return `${names.slice(0, 3).join(' · ')} +${names.length - 3}`
}

function fulfillmentLabel(order: Order): string {
  const fulfilled = fulfilledItemCount(order)
  const total = order.items.length
  if (total === 0) return 'No items'
  if (fulfilled === 0 || fulfilled === total) return pluralize(total, 'item')
  return `${fulfilled}/${total} fulfilled`
}

const STATUS_TONE: Record<OrderStatus, 'accent' | 'muted' | 'warning'> = {
  Open: 'muted',
  Partial: 'warning',
  Fulfilled: 'accent',
}
</script>

<template>
  <ResourceListRow
    v-for="order in orders"
    :id="order.orderId"
    :key="order.orderId"
    :title="order.displayName"
    :selected="order.orderId === selectedId"
    @select="emit('select', $event)"
  >
    <TypeTag
      :tone="STATUS_TONE[orderStatus(order)]"
      :title="statusTitle(order)"
    >
      {{ orderStatus(order) }}
    </TypeTag>
    <span
      v-if="order.orderedAt"
      class="font-mono text-meta text-text-4"
      :title="`Ordered at ${order.orderedAt}`"
    >
      {{ order.orderedAt.slice(0, 10) }}
    </span>
    <template #badges>
      <span
        class="font-mono text-meta text-text-3"
        :title="statusTitle(order)"
      >
        {{ fulfillmentLabel(order) }}
      </span>
    </template>
    <p
      v-if="order.items.length > 0"
      class="basis-full truncate text-meta text-text-3"
      :title="capabilitySummary(order)"
    >
      {{ capabilitySummary(order) }}
    </p>
  </ResourceListRow>
</template>
