<script setup lang="ts">
import { computed } from 'vue'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import { useOrdersStore } from '@/stores/orders'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import CapabilityVersionsSection from '@/components/capabilities/CapabilityVersionsSection.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import TypeTag from '@/components/TypeTag.vue'
import { formatTimestamp } from '@/utils/annotations'
import { LIFECYCLE_TAG } from '@/constants/lifecycle'
import { capabilityLifecycle, latestVersionRef } from '@/utils/version'
import { pluralize } from '@/utils/text'
import type { Capability } from '@/types/capability'

const props = defineProps<{
  capability: Capability | undefined
}>()

const store = useCapabilitiesStore()
const parametersStore = useParametersStore()
const ordersStore = useOrdersStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

const orderedIn = computed(() => {
  const id = props.capability?.capabilityId
  if (!id) return []
  return ordersStore.orders
    .filter((o) => o.items.some((i) => i.capability === id))
    .sort((a, b) => (b.orderedAt ?? '').localeCompare(a.orderedAt ?? ''))
})

function orderItemCount(orderId: string): number {
  const order = ordersStore.orderMap.get(orderId)
  const id = props.capability?.capabilityId
  if (!order || !id) return 0
  return order.items.filter((i) => i.capability === id).length
}

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.capability?.capabilityId ?? '',
)

const myVariants = computed(() =>
  (props.capability?.versions ?? []).flatMap((v) => v.variants ?? []),
)

const dependsOn = computed(() => {
  const byCap = new Map<string, Map<string, Set<string>>>()
  for (const v of myVariants.value) {
    for (const d of v.dependencies ?? []) {
      const params = byCap.get(d.capability) ?? new Map<string, Set<string>>()
      for (const op of d.outputParameters ?? []) {
        const set = params.get(op.parameter) ?? new Set<string>()
        for (const value of op.values) set.add(value)
        params.set(op.parameter, set)
      }
      byCap.set(d.capability, params)
    }
  }
  return [...byCap.entries()].map(([id, params]) => dependencyEntry(id, params))
})

const requiredBy = computed(() => {
  const id = props.capability?.capabilityId
  if (!id) return []
  const seen = new Set<string>()
  for (const c of store.capabilities) {
    if (c.capabilityId === id) continue
    const depends = (c.versions ?? []).some((v) =>
      (v.variants ?? []).some((variant) =>
        (variant.dependencies ?? []).some((d) => d.capability === id),
      ),
    )
    if (depends) seen.add(c.capabilityId)
  }
  return [...seen].map((capId) => {
    const cap = store.capabilityMap.get(capId)
    return { id: capId, name: cap?.displayName, description: cap?.description }
  })
})

function parameterName(parameterId: string): string {
  return parametersStore.parameterMap.get(parameterId)?.displayName ?? parameterId
}

function dependencyEntry(
  id: string,
  params: Map<string, Set<string>>,
): {
  id: string
  name: string | undefined
  description: string | undefined
  unresolved: boolean
  requiresLine: string
} {
  const cap = store.capabilityMap.get(id)
  const requires = [...params.entries()].map(
    ([parameterId, values]) => `${parameterName(parameterId)} ${[...values].join(' / ')}`,
  )
  return {
    id,
    name: cap?.displayName,
    description: cap?.description,
    unresolved: !cap,
    requiresLine: requires.length > 0 ? `Requires: ${requires.join(' · ')}` : '',
  }
}

const lifecycle = computed(() =>
  props.capability ? capabilityLifecycle(props.capability.versions) : 'no versions',
)

const latestVersionLabel = computed(
  () => latestVersionRef(props.capability?.versions)?.version?.version,
)
</script>

<template>
  <div
    v-if="capability"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="capability.capabilityId"
      :title="capability.displayName"
      :subtitle="capability.description"
    >
      <TypeTag>Capability</TypeTag>
      <TypeTag :tone="LIFECYCLE_TAG[lifecycle].tone">
        {{ LIFECYCLE_TAG[lifecycle].label }}
      </TypeTag>
      <TypeTag
        v-if="latestVersionLabel"
        tone="muted"
      >
        v{{ latestVersionLabel }}
      </TypeTag>
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner
        v-if="store.hasDetailError(capability.capabilityId)"
        :message="store.detailErrorMessage(capability.capabilityId)"
      />
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-2 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <CapabilityVersionsSection :capability="capability" />
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <SectionLabel :count="orderedIn.length">Ordered in</SectionLabel>
            <p
              v-if="orderedIn.length === 0"
              class="text-data leading-snug text-text-4"
            >
              Not referenced by any order yet.
            </p>
            <ResourceLinkCard
              v-for="order in orderedIn"
              :id="order.orderId"
              :key="order.orderId"
              badge="Order"
              :name="order.displayName"
              title="Go to order"
              @click="goToResource('Order', order.orderId)"
            >
              <template #subline>
                <span class="min-w-0 truncate font-mono text-meta text-text-4">
                  {{ pluralize(orderItemCount(order.orderId), 'item') }}
                </span>
                <span
                  v-if="order.orderedAt"
                  class="ml-auto shrink-0 font-mono text-meta text-text-4"
                >
                  {{ formatTimestamp(order.orderedAt) }}
                </span>
              </template>
            </ResourceLinkCard>
          </div>
          <div>
            <SectionLabel :count="dependsOn.length">Depends on</SectionLabel>
            <p
              v-if="dependsOn.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No dependencies.
            </p>
            <ResourceLinkCard
              v-for="dep in dependsOn"
              :id="dep.id"
              :key="dep.id"
              badge="Capability"
              :badge-error="dep.unresolved"
              :name="dep.name ?? 'Unresolved capability'"
              :name-error="dep.unresolved"
              :clickable="!dep.unresolved"
              :copyable="false"
              title="Go to capability"
              @click="goToResource('Capability', dep.id)"
            >
              <template
                v-if="dep.description || dep.requiresLine"
                #subline
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span
                    v-if="dep.description"
                    class="truncate text-meta text-text-4"
                  >
                    {{ dep.description }}
                  </span>
                  <span
                    v-if="dep.requiresLine"
                    class="truncate font-mono text-meta text-text-3"
                    :title="dep.requiresLine"
                  >
                    {{ dep.requiresLine }}
                  </span>
                </span>
              </template>
            </ResourceLinkCard>
          </div>
          <div v-if="requiredBy.length > 0">
            <SectionLabel :count="requiredBy.length">Required by</SectionLabel>
            <ResourceLinkCard
              v-for="dep in requiredBy"
              :id="dep.id"
              :key="dep.id"
              badge="Capability"
              :name="dep.name ?? dep.id"
              title="Go to capability"
              @click="goToResource('Capability', dep.id)"
            >
              <template
                v-if="dep.description"
                #subline
              >
                <span class="min-w-0 truncate text-meta text-text-4">
                  {{ dep.description }}
                </span>
              </template>
            </ResourceLinkCard>
          </div>
          <DetailFindingsSection :findings="relatedFindings" />
          <DetailAnnotationsSection :annotations="capability.annotations" />
        </div>
      </div>
    </div>
  </div>
  <DetailEmptyState
    v-else
    label="Select a capability to inspect"
  />
</template>
