<script setup lang="ts">
import { useFindingsStore } from '@/stores/findings'
import { useOrdersStore } from '@/stores/orders'
import TypeTag from '@/components/TypeTag.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import ChildCountBars from '@/components/list/ChildCountBars.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import { capabilityLifecycle, latestVersionRef, type CapabilityLifecycle } from '@/utils/version'
import type { Capability } from '@/types/capability'

defineProps<{
  capabilities: Capability[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const findingsStore = useFindingsStore()
const ordersStore = useOrdersStore()

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function orderCount(id: string): number {
  return ordersStore.orders.filter((o) => o.items.some((i) => i.capability === id)).length
}

function latestVersion(c: Capability): string | undefined {
  return latestVersionRef(c.versions)?.version?.version
}

function lifecycle(c: Capability): CapabilityLifecycle {
  return capabilityLifecycle(c.versions)
}

const LIFECYCLE_TAG: Record<
  CapabilityLifecycle,
  { label: string; tone: 'accent' | 'muted' | 'warning' | 'error' }
> = {
  available: { label: 'Available', tone: 'accent' },
  upcoming: { label: 'Upcoming', tone: 'muted' },
  deprecated: { label: 'Deprecated', tone: 'warning' },
  terminated: { label: 'Terminated', tone: 'error' },
  'no versions': { label: 'No versions', tone: 'muted' },
}
</script>

<template>
  <ResourceListRow
    v-for="capability in capabilities"
    :id="capability.capabilityId"
    :key="capability.capabilityId"
    :title="capability.displayName"
    :selected="capability.capabilityId === selectedId"
    @select="emit('select', $event)"
  >
    <TypeTag :tone="LIFECYCLE_TAG[lifecycle(capability)].tone">
      {{ LIFECYCLE_TAG[lifecycle(capability)].label }}
    </TypeTag>
    <span
      v-if="latestVersion(capability)"
      class="font-mono text-meta text-text-4"
    >
      v{{ latestVersion(capability) }}
    </span>
    <template #badges>
      <ChildCountBars
        :count="capability.versions?.length ?? 0"
        noun="version"
      />
      <FindingsBadge :count="findingCount(capability.capabilityId)" />
      <InstanceCountBadge
        v-if="ordersStore.loaded"
        :count="orderCount(capability.capabilityId)"
        noun="referencing order"
      />
    </template>
  </ResourceListRow>
</template>
