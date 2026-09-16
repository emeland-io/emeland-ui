<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconArrowDown, IconArrowUp, IconBookmark } from '@tabler/icons-vue'
import { useOrdersStore } from '@/stores/orders'
import { useFavorites } from '@/composables/useFavorites'
import TypeTag from '@/components/TypeTag.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { LIFECYCLE_TAG } from '@/constants/lifecycle'
import { capabilityLifecycle, latestVersionRef } from '@/utils/version'
import type { CapabilityLifecycle } from '@/utils/version'
import type { Capability } from '@/types/capability'

const props = defineProps<{
  capabilities: Capability[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  order: [ids: string[]]
}>()

const ordersStore = useOrdersStore()
const { isFavorite, toggleFavorite } = useFavorites()

type SortKey =
  'favorite' | 'name' | 'lifecycle' | 'version' | 'versions' | 'orders' | 'dependencies'
const sortKey = ref<SortKey>('name')
const sortAsc = ref(true)

const COLUMNS: { key: SortKey; label: string; align?: 'right'; icon?: boolean }[] = [
  { key: 'favorite', label: 'Favorite', icon: true },
  { key: 'name', label: 'Capability' },
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'version', label: 'Latest' },
  { key: 'versions', label: 'Versions', align: 'right' },
  { key: 'orders', label: 'Orders', align: 'right' },
  { key: 'dependencies', label: 'Dependencies', align: 'right' },
]

const LIFECYCLE_RANK: Record<CapabilityLifecycle, number> = {
  available: 0,
  upcoming: 1,
  deprecated: 2,
  terminated: 3,
  'no versions': 4,
}

function orderCount(id: string): number {
  return ordersStore.orders.filter((o) => o.items.some((i) => i.capability === id)).length
}

/** distinct capabilities depended on across all variants of all versions */
function dependencyCount(c: Capability): number {
  const ids = new Set<string>()
  for (const v of c.versions ?? []) {
    for (const variant of v.variants ?? []) {
      for (const d of variant.dependencies ?? []) ids.add(d.capability)
    }
  }
  return ids.size
}

function latestVersion(c: Capability): string {
  return latestVersionRef(c.versions)?.version?.version ?? ''
}

function sortValue(c: Capability, key: SortKey): string | number {
  switch (key) {
    case 'favorite':
      // favorites first when ascending, matching the card grid
      return isFavorite(c.capabilityId) ? 0 : 1
    case 'name':
      return c.displayName.toLowerCase()
    case 'lifecycle':
      return LIFECYCLE_RANK[capabilityLifecycle(c.versions)]
    case 'version':
      return latestVersion(c)
    case 'versions':
      return c.versions?.length ?? 0
    case 'orders':
      return orderCount(c.capabilityId)
    case 'dependencies':
      return dependencyCount(c)
  }
}

const rows = computed(() => {
  const dir = sortAsc.value ? 1 : -1
  return [...props.capabilities].sort((a, b) => {
    const va = sortValue(a, sortKey.value)
    const vb = sortValue(b, sortKey.value)
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { numeric: true })
    return cmp * dir || a.displayName.localeCompare(b.displayName)
  })
})

watch(
  rows,
  (r) =>
    emit(
      'order',
      r.map((c) => c.capabilityId),
    ),
  { immediate: true },
)

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = key === 'favorite' || key === 'name' || key === 'lifecycle' || key === 'version'
  }
}
</script>

<template>
  <table class="w-full border-collapse text-data">
    <thead class="sticky top-0 z-10 bg-bg-0">
      <tr class="border-b border-border-2">
        <th
          v-for="col in COLUMNS"
          :key="col.key"
          class="cursor-pointer select-none px-4 py-2 font-medium text-text-3 transition-colors hover:text-text-1"
          :class="col.align === 'right' ? 'text-right' : 'text-left'"
          :aria-sort="sortKey === col.key ? (sortAsc ? 'ascending' : 'descending') : undefined"
          :title="col.icon ? col.label : undefined"
          @click="sortBy(col.key)"
        >
          <span class="inline-flex items-center gap-1">
            <IconBookmark
              v-if="col.icon"
              :size="13"
              :stroke-width="2"
              :aria-label="col.label"
            />
            <template v-else>{{ col.label }}</template>
            <component
              :is="sortAsc ? IconArrowUp : IconArrowDown"
              v-if="sortKey === col.key"
              :size="12"
              :stroke-width="2"
            />
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="c in rows"
        :key="c.capabilityId"
        :data-row-id="c.capabilityId"
        class="cursor-pointer border-b border-border-1 transition-colors"
        :class="c.capabilityId === selectedId ? 'bg-accent/5' : 'hover:bg-bg-1'"
        @click="emit('select', c.capabilityId)"
      >
        <td class="w-8 py-2 pl-4 pr-1">
          <FavoriteButton
            :active="isFavorite(c.capabilityId)"
            :name="c.displayName"
            :data-favorite-id="c.capabilityId"
            @toggle="toggleFavorite(c.capabilityId)"
          />
        </td>
        <td class="px-4 py-2 font-medium text-text-1">{{ c.displayName }}</td>
        <td class="px-4 py-2">
          <TypeTag :tone="LIFECYCLE_TAG[capabilityLifecycle(c.versions)].tone">
            {{ LIFECYCLE_TAG[capabilityLifecycle(c.versions)].label }}
          </TypeTag>
        </td>
        <td class="px-4 py-2 font-mono text-meta text-text-3">
          {{ latestVersion(c) ? `v${latestVersion(c)}` : '—' }}
        </td>
        <td class="px-4 py-2 text-right font-mono text-meta text-text-3">
          {{ c.versions?.length ?? 0 }}
        </td>
        <td
          class="px-4 py-2 text-right font-mono text-meta text-text-3"
          :class="orderCount(c.capabilityId) > 0 ? '' : 'text-text-4'"
        >
          {{ orderCount(c.capabilityId) }}
        </td>
        <td
          class="px-4 py-2 text-right font-mono text-meta text-text-3"
          :class="dependencyCount(c) > 0 ? '' : 'text-text-4'"
        >
          {{ dependencyCount(c) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
