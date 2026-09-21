<script setup lang="ts">
import { computed, onMounted, ref, defineAsyncComponent } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import OrdersList from '@/components/orders/OrdersList.vue'
import OrderDetail from '@/components/orders/OrderDetail.vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'
import GraphPanel from '@/components/graph/GraphPanel.vue'
import GraphLayerToggle from '@/components/graph/GraphLayerToggle.vue'
import GraphPaneSkeleton from '@/components/graph/GraphPaneSkeleton.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useSearchMatches } from '@/composables/useResourceList'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useResourceNav } from '@/composables/useResourceNav'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useGraphPanel, type GraphPaneHandle } from '@/composables/useGraphPanel'
import { LAYER_TOGGLE_KEYS, GRAPH_TOGGLE_KEYS, layerKeyHint } from '@/constants/shortcuts'
import { prefixedId } from '@/graph/ids'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { fulfilledItemCount, orderStatus, type OrderStatus } from '@/utils/orders'
import { toggledSet } from '@/utils/set'
import type { Order } from '@/types/order'

// Heavy (VueFlow + dagre). Always visible in this layout, so it loads up front.
const OfferingGraphPane = defineAsyncComponent({
  loader: () => import('@/components/offering/OfferingGraphPane.vue'),
  loadingComponent: GraphPaneSkeleton,
})

const store = useOrdersStore()
const capabilitiesStore = useCapabilitiesStore()
const parametersStore = useParametersStore()
const systemStore = useSystemStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

const STATUSES: readonly OrderStatus[] = ['Open', 'Partial', 'Fulfilled']

const search = ref('')
const activeStatuses = ref<Set<string>>(new Set())
const activeCapabilities = ref<Set<string>>(new Set())

// newest orders first: undated ones sink to the end
const sortedOrders = computed(() =>
  [...store.orders].sort(
    (a, b) =>
      (b.orderedAt ?? '').localeCompare(a.orderedAt ?? '') ||
      a.displayName.localeCompare(b.displayName),
  ),
)

// capabilities referenced by at least one order, as filter chips —
// most-ordered first, with a count so dense catalogs stay scannable
const capabilityChips = computed(() => {
  const counts = new Map<string, number>()
  for (const o of store.orders) {
    const seen = new Set<string>()
    for (const item of o.items) {
      if (seen.has(item.capability)) continue
      seen.add(item.capability)
      counts.set(item.capability, (counts.get(item.capability) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => {
      const fullName = capabilitiesStore.capabilityMap.get(id)?.displayName ?? id
      const short = fullName.length > 22 ? `${fullName.slice(0, 20).trimEnd()}…` : fullName
      return {
        id,
        name: count > 1 ? `${short} · ${count}` : short,
        title: count > 1 ? `${fullName} · ${count} orders` : fullName,
      }
    })
    .sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.title.localeCompare(b.title),
    )
})

const chipFilteredOrders = computed(() =>
  sortedOrders.value.filter((o) => {
    if (activeStatuses.value.size > 0 && !activeStatuses.value.has(orderStatus(o))) return false
    if (
      activeCapabilities.value.size > 0 &&
      !o.items.some((i) => activeCapabilities.value.has(i.capability))
    )
      return false
    return true
  }),
)

const filteredOrders = computed(() =>
  chipFilteredOrders.value.filter((o) => {
    if (
      matchesQuery(search.value, o.displayName, o.orderId) ||
      matchesAnnotations(search.value, o.annotations)
    ) {
      return true
    }
    // also match ordered capability names
    return o.items.some((i) => {
      const name = capabilitiesStore.capabilityMap.get(i.capability)?.displayName
      return name ? matchesQuery(search.value, name) : false
    })
  }),
)

const hasActiveFilters = computed(
  () => !!search.value || activeStatuses.value.size > 0 || activeCapabilities.value.size > 0,
)

const totalItems = computed(() => store.orders.reduce((n, o) => n + o.items.length, 0))
const fulfilledItems = computed(() => store.orders.reduce((n, o) => n + fulfilledItemCount(o), 0))

function toggleStatus(status: string) {
  activeStatuses.value = toggledSet(activeStatuses.value, status)
}

function toggleCapability(id: string) {
  activeCapabilities.value = toggledSet(activeCapabilities.value, id)
}

function clearFilters() {
  search.value = ''
  activeStatuses.value = new Set()
  activeCapabilities.value = new Set()
}

const matchIds = useSearchMatches(
  search,
  () => store.orders,
  (x) => x.orderId,
  (x) => [x.displayName, x.orderId],
)

const {
  selectedId,
  selected: selectedOrder,
  select: selectOrder,
} = useResourceSelection<Order>({
  items: () => store.orders,
  filtered: () => filteredOrders.value,
  idOf: (o) => o.orderId,
  loadDetail: (id) => store.loadOrderDetail(id),
})

// the catalog slice the shown orders draw from
const relevantCapabilities = computed(() => {
  const referenced = new Set(
    chipFilteredOrders.value.flatMap((o) => o.items.map((i) => i.capability)),
  )
  return capabilitiesStore.capabilities.filter((c) => referenced.has(c.capabilityId))
})

// Graph controls
const graphPane = ref<GraphPaneHandle | null>(null)
const graphPanel = useGraphPanel({ pane: graphPane, matchIds })
const showFulfillment = ref(true)

function toggleFulfillment() {
  showFulfillment.value = !showFulfillment.value
}

useGraphKeyToggles({
  [LAYER_TOGGLE_KEYS.instances]: toggleFulfillment,
  [GRAPH_TOGGLE_KEYS.graph]: graphPanel.toggleGraph,
  [GRAPH_TOGGLE_KEYS.fullscreen]: graphPanel.toggleFullscreen,
})

useListKeyboardNav(
  computed(() => filteredOrders.value.map((o) => o.orderId)),
  selectedId,
  selectOrder,
  ref(false),
)

onMounted(async () => {
  findingsStore.load()
  systemStore.load()
  systemStore.loadSystemInstances()
  await Promise.all([store.load(), capabilitiesStore.load(), parametersStore.load()])
  // versions and valid values live in the details; hydrate them for the
  // ordered-version chips and bound-value checks
  capabilitiesStore.loadAllDetails()
  parametersStore.loadAllDetails()
  await store.loadAllDetails()
})
</script>

<template>
  <ResourceViewShell
    :loading="store.loading"
    loading-label="Loading orders..."
    :error="store.error"
    :error-list-empty="store.orders.length === 0"
    retry-label="Retry"
    @retry="store.reload()"
  >
    <template #header>
      <ViewHeader
        title="Orders"
        :count="store.orders.length"
      >
        <span class="font-mono text-label text-text-3">{{ totalItems }} items</span>
        <span
          class="font-mono text-label"
          :class="fulfilledItems < totalItems ? 'text-warning' : 'text-text-4'"
        >
          {{ fulfilledItems }} fulfilled
        </span>
      </ViewHeader>
    </template>

    <FilterToolbar
      v-model:search="search"
      placeholder="Search orders, IDs, annotations... (/)"
      :has-active-filters="hasActiveFilters"
      @clear="clearFilters"
    >
      <FilterChipGroup
        label="Status"
        :items="[...STATUSES]"
        :active="activeStatuses"
        @toggle="toggleStatus"
      />
      <FilterChipGroup
        label="Capability"
        :items="capabilityChips"
        :active="activeCapabilities"
        :visible-limit="5"
        @toggle="toggleCapability"
      />
    </FilterToolbar>

    <EmptyState
      v-if="filteredOrders.length === 0"
      title="No orders"
      :hint="hasActiveFilters ? 'No results for current filters' : 'No orders issued yet'"
    />

    <!-- list | (graph over detail) -->
    <ListDetail v-else>
      <template #list>
        <div class="flex h-full flex-col">
          <ListPaneBar
            :count="filteredOrders.length"
            :total="store.orders.length"
          />
          <div class="min-h-0 flex-1 overflow-y-auto">
            <OrdersList
              :orders="filteredOrders"
              :selected-id="selectedId"
              @select="selectOrder"
            />
          </div>
        </div>
      </template>

      <template #detail>
        <div
          class="flex min-w-0 flex-1 flex-col overflow-hidden"
          :class="graphPanel.isResizing ? 'select-none' : ''"
        >
          <GraphPanel
            :panel="graphPanel"
            :can-focus="!!selectedId"
          >
            <template #layers>
              <GraphLayerToggle
                label="Instances"
                :on="showFulfillment"
                :title="`Show the system instances fulfilling order items ${layerKeyHint('instances')}`"
                @toggle="toggleFulfillment"
              />
            </template>
            <OfferingGraphPane
              ref="graphPane"
              :match-ids="new Set([...matchIds].map((id) => prefixedId('order', id)))"
              :capabilities="relevantCapabilities"
              :orders="chipFilteredOrders"
              :selected-order-id="selectedId"
              :show-fulfillment="showFulfillment"
              :show-controls="false"
              class="h-full"
              @select-order="selectOrder"
              @select-capability="(id) => goToResource('Capability', id)"
              @open-system="(id) => goToResource('System', id)"
            />
          </GraphPanel>

          <!-- Detail -->
          <div
            v-if="!graphPanel.fullscreen"
            class="flex min-h-0 flex-1 overflow-hidden border-t border-border-1"
          >
            <OrderDetail :order="selectedOrder" />
          </div>
        </div>
      </template>
    </ListDetail>
  </ResourceViewShell>
</template>
