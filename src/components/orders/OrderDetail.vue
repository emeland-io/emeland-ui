<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconChevronRight } from '@tabler/icons-vue'
import { useOrdersStore } from '@/stores/orders'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import TypeTag from '@/components/TypeTag.vue'
import ParameterValueList from '@/components/parameters/ParameterValueList.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import { formatTimestamp } from '@/utils/annotations'
import { fulfilledItemCount, orderStatus, orderStatusLabel } from '@/utils/orders'
import { versionStatus, type VersionStatus } from '@/utils/version'
import type { Order, OrderItem } from '@/types/order'

const props = defineProps<{
  order: Order | undefined
}>()

const store = useOrdersStore()
const capabilitiesStore = useCapabilitiesStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

const expandedItems = ref<Set<string>>(new Set())

watch(
  () => props.order?.orderId,
  () => {
    const first = props.order?.items[0]?.orderItemId
    expandedItems.value = first ? new Set([first]) : new Set()
  },
  { immediate: true },
)

function isExpanded(id: string): boolean {
  return expandedItems.value.has(id)
}

function toggleItem(id: string) {
  const next = new Set(expandedItems.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedItems.value = next
}

function capabilityName(id: string): string | undefined {
  return capabilitiesStore.capabilityMap.get(id)?.displayName
}

function itemName(item: OrderItem): string {
  return capabilityName(item.capability) ?? item.capability
}

function orderedVersion(item: OrderItem): { label: string; status: VersionStatus } | undefined {
  if (!item.capabilityVersion) return undefined
  const ref = capabilitiesStore.capabilityMap
    .get(item.capability)
    ?.versions?.find((v) => v.capabilityVersionId === item.capabilityVersion)
  if (!ref?.version) return undefined
  return { label: `v${ref.version.version}`, status: versionStatus(ref.version) }
}

/** the system that fulfills an order item, when its instance exists */
function fulfillingSystem(
  item: OrderItem,
): { id: string; name: string; instanceName: string } | undefined {
  if (!item.systemInstance) return undefined
  const inst = systemStore.systemInstanceMap.get(item.systemInstance)
  if (!inst?.system) return undefined
  const name = systemStore.systemMap.get(inst.system)?.displayName
  return name ? { id: inst.system, name, instanceName: inst.displayName } : undefined
}

type ItemFulfillment = 'fulfilled' | 'open' | 'unresolved'

function itemFulfillment(item: OrderItem): ItemFulfillment {
  if (!item.systemInstance) return 'open'
  return fulfillingSystem(item) ? 'fulfilled' : 'unresolved'
}

/** muted second line on the item row when collapsed */
function itemSubtitle(item: OrderItem): string | undefined {
  if (isExpanded(item.orderItemId)) return undefined
  const state = itemFulfillment(item)
  if (state === 'fulfilled') {
    const sys = fulfillingSystem(item)!
    return `by ${sys.name} · ${sys.instanceName}`
  }
  if (state === 'unresolved') return 'unresolved instance'
  return 'Waiting for a system instance'
}

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.order?.orderId ?? '',
)

const VERSION_TONE: Record<VersionStatus, 'accent' | 'muted' | 'warning' | 'error'> = {
  available: 'accent',
  upcoming: 'muted',
  deprecated: 'warning',
  terminated: 'error',
}

const STATUS_TONE = {
  Open: 'muted',
  Partial: 'warning',
  Fulfilled: 'accent',
} as const

const ITEM_STATUS = {
  fulfilled: { label: 'Fulfilled', tone: 'accent' as const },
  open: { label: 'Open', tone: 'muted' as const },
  unresolved: { label: 'Unresolved', tone: 'error' as const },
} as const
</script>

<template>
  <div
    v-if="order"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="order.orderId"
      :title="order.displayName"
      :subtitle="order.description"
    >
      <TypeTag>Order</TypeTag>
      <TypeTag
        :tone="STATUS_TONE[orderStatus(order)]"
        :title="`${fulfilledItemCount(order)} of ${order.items.length} items fulfilled by a system instance`"
      >
        {{ orderStatus(order) }}
      </TypeTag>
      <span
        v-if="order.orderedAt"
        class="font-mono text-label text-text-4"
      >
        {{ formatTimestamp(order.orderedAt) }}
      </span>
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner
        v-if="store.hasDetailError(order.orderId)"
        :message="store.detailErrorMessage(order.orderId)"
      />
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-2 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <div>
            <div class="mb-3 flex items-baseline justify-between gap-3">
              <SectionLabel
                class="!mb-0"
                :count="order.items.length"
              >
                Order items
              </SectionLabel>
              <TypeTag
                :tone="STATUS_TONE[orderStatus(order)]"
                :title="`${fulfilledItemCount(order)} of ${order.items.length} items fulfilled by a system instance`"
              >
                {{ orderStatusLabel(order) }}
              </TypeTag>
            </div>
            <div class="flex flex-col gap-2">
              <div
                v-for="item in order.items"
                :key="item.orderItemId"
                class="overflow-hidden rounded-md border border-border-1 bg-bg-1"
              >
                <button
                  type="button"
                  class="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-bg-2"
                  @click="toggleItem(item.orderItemId)"
                >
                  <IconChevronRight
                    :size="14"
                    :stroke-width="2"
                    class="mt-0.5 shrink-0 text-text-4 transition-transform"
                    :class="isExpanded(item.orderItemId) ? 'rotate-90' : ''"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="flex flex-wrap items-center gap-2">
                      <span
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="{
                          'bg-accent': itemFulfillment(item) === 'fulfilled',
                          'bg-text-4': itemFulfillment(item) === 'open',
                          'bg-error': itemFulfillment(item) === 'unresolved',
                        }"
                      />
                      <TypeTag :tone="ITEM_STATUS[itemFulfillment(item)].tone">
                        {{ ITEM_STATUS[itemFulfillment(item)].label }}
                      </TypeTag>
                      <span class="min-w-0 truncate text-body font-medium text-text-1">
                        {{ itemName(item) }}
                      </span>
                      <TypeTag
                        v-if="orderedVersion(item)"
                        :tone="VERSION_TONE[orderedVersion(item)!.status]"
                        :title="
                          orderedVersion(item)!.status === 'available'
                            ? 'Ordered capability version'
                            : `Ordered capability version is ${orderedVersion(item)!.status}`
                        "
                      >
                        {{ orderedVersion(item)!.label }}
                        <template v-if="orderedVersion(item)!.status !== 'available'">
                          · {{ orderedVersion(item)!.status }}
                        </template>
                      </TypeTag>
                    </span>
                    <span
                      v-if="itemSubtitle(item)"
                      class="mt-1 block truncate font-mono text-meta text-text-4"
                    >
                      {{ itemSubtitle(item) }}
                    </span>
                  </span>
                </button>

                <div
                  v-if="isExpanded(item.orderItemId)"
                  class="border-t border-border-1 px-3 py-2.5"
                >
                  <ResourceLinkCard
                    :id="item.capability"
                    badge="Capability"
                    :name="itemName(item)"
                    title="Go to capability"
                    @click="goToResource('Capability', item.capability)"
                  >
                    <template #subline>
                      <span
                        class="flex min-w-0 items-center gap-1.5 font-mono text-meta text-text-4"
                      >
                        <span class="truncate">{{ item.orderItemId }}</span>
                      </span>
                      <CopyButton
                        :value="item.orderItemId"
                        :size="12"
                        @click.stop
                      />
                    </template>
                  </ResourceLinkCard>

                  <ParameterValueList
                    v-if="item.boundValues?.length"
                    class="mt-2"
                    :entries="
                      item.boundValues.map((bv) => ({
                        parameterId: bv.parameterId,
                        values: [bv.value],
                      }))
                    "
                  />

                  <div
                    v-if="itemFulfillment(item) !== 'open'"
                    class="mt-2 border-t border-border-1 pt-2"
                  >
                    <div
                      v-if="fulfillingSystem(item)"
                      class="flex min-w-0 items-center gap-1.5 font-mono text-meta text-text-4"
                    >
                      <span class="shrink-0">by</span>
                      <button
                        class="shrink-0 truncate text-accent-text transition-colors hover:underline"
                        :title="`Go to system ${fulfillingSystem(item)!.name}`"
                        @click="goToResource('System', fulfillingSystem(item)!.id)"
                      >
                        {{ fulfillingSystem(item)!.name }}
                      </button>
                      <span class="min-w-0 truncate">
                        · {{ fulfillingSystem(item)!.instanceName }}
                      </span>
                    </div>
                    <div
                      v-else-if="item.systemInstance"
                      class="flex min-w-0 items-center gap-1.5 font-mono text-meta"
                    >
                      <span
                        class="shrink-0 text-error"
                        title="References a system instance that does not exist"
                      >
                        unresolved instance
                      </span>
                      <span class="min-w-0 truncate text-text-4">{{ item.systemInstance }}</span>
                    </div>
                  </div>
                  <div
                    v-else
                    class="mt-2 border-t border-border-1 pt-2 font-mono text-meta text-text-4"
                    title="No system instance fulfills this item yet"
                  >
                    Waiting for a system instance
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <SectionLabel>Ordered by</SectionLabel>
            <p
              v-if="!order.orgUnit"
              class="text-data leading-snug text-text-4"
            >
              No ordering org unit recorded.
            </p>
            <span
              v-else
              class="flex items-center gap-1.5"
            >
              <span class="break-all font-mono text-data text-text-3">{{ order.orgUnit }}</span>
              <CopyButton
                :value="order.orgUnit"
                :size="12"
              />
            </span>
          </div>
          <DetailFindingsSection :findings="relatedFindings" />
          <DetailAnnotationsSection :annotations="order.annotations" />
        </div>
      </div>
    </div>
  </div>
  <DetailEmptyState
    v-else
    label="Select an order to inspect"
  />
</template>
