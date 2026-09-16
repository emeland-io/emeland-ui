<script setup lang="ts">
import { computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useFindingsStore } from '@/stores/findings'
import { useFavorites } from '@/composables/useFavorites'
import TypeTag from '@/components/TypeTag.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { LIFECYCLE_TAG } from '@/constants/lifecycle'
import { capabilityLifecycle, latestVersionRef } from '@/utils/version'
import { groupCapabilitiesByLifecycle } from '@/utils/capabilities'
import type { Capability } from '@/types/capability'

const props = defineProps<{
  capabilities: Capability[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const ordersStore = useOrdersStore()
const findingsStore = useFindingsStore()
const { isFavorite, toggleFavorite } = useFavorites()

const groups = computed(() => groupCapabilitiesByLifecycle(props.capabilities, isFavorite))

function orderCount(id: string): number {
  return ordersStore.orders.filter((o) => o.items.some((i) => i.capability === id)).length
}

function latestVersion(c: Capability): string | undefined {
  return latestVersionRef(c.versions)?.version?.version
}
</script>

<template>
  <div class="px-4 py-4">
    <section
      v-for="group in groups"
      :key="group.lifecycle"
      class="mb-6"
    >
      <div class="mb-2 flex items-baseline gap-2">
        <span class="text-meta font-semibold uppercase tracking-widest text-text-4">
          {{ LIFECYCLE_TAG[group.lifecycle].label }}
        </span>
        <span
          class="rounded-full bg-bg-3 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-3"
        >
          {{ group.capabilities.length }}
        </span>
      </div>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
        <div
          v-for="c in group.capabilities"
          :key="c.capabilityId"
          class="relative"
        >
          <button
            :data-row-id="c.capabilityId"
            type="button"
            class="group flex w-full flex-col rounded-md border bg-bg-1 px-3 py-2.5 text-left transition-colors"
            :class="
              c.capabilityId === selectedId
                ? 'border-accent/50 bg-accent/5'
                : 'border-border-1 hover:border-border-2 hover:bg-bg-2'
            "
            @click="emit('select', c.capabilityId)"
          >
            <div class="flex items-start justify-between gap-2">
              <span
                class="min-w-0 truncate text-body font-medium text-text-1"
                :class="findingsStore.findingCountFor(c.capabilityId) > 0 ? 'pr-20' : 'pr-7'"
              >
                {{ c.displayName }}
              </span>
            </div>

            <div class="mt-1.5 flex items-center gap-1.5">
              <TypeTag :tone="LIFECYCLE_TAG[capabilityLifecycle(c.versions)].tone">
                {{ LIFECYCLE_TAG[capabilityLifecycle(c.versions)].label }}
              </TypeTag>
              <span
                v-if="latestVersion(c)"
                class="font-mono text-meta text-text-4"
              >
                v{{ latestVersion(c) }}
              </span>
            </div>

            <div class="mt-2.5 flex items-center gap-3 font-mono text-micro text-text-3">
              <span>{{ c.versions?.length ?? 0 }} versions</span>
              <span :class="orderCount(c.capabilityId) > 0 ? '' : 'text-text-4'">
                {{ orderCount(c.capabilityId) }} orders
              </span>
            </div>
          </button>

          <div class="absolute right-2 top-2 flex items-center gap-1">
            <FindingsBadge :count="findingsStore.findingCountFor(c.capabilityId)" />
            <FavoriteButton
              :active="isFavorite(c.capabilityId)"
              :name="c.displayName"
              :data-favorite-id="c.capabilityId"
              @toggle="toggleFavorite(c.capabilityId)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
