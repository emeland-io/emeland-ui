<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconAlertTriangle } from '@tabler/icons-vue'
import { useNodesStore } from '@/stores/nodes'
import { useFindingsStore } from '@/stores/findings'
import ListDetail from '@/components/ListDetail.vue'
import TypesDrawerShell from '@/components/drawer/TypesDrawerShell.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import FindingCard from '@/components/detail/FindingCard.vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import FilterChipGroup from '@/components/toolbar/FilterChipGroup.vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import { useResourceNav } from '@/composables/useResourceNav'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useResourceSelection } from '@/composables/useResourceSelection'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import { useTypesDrawer } from '@/composables/useTypesDrawer'
import { toggledSet } from '@/utils/set'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { categoryColorForNode, categoryColorForName } from '@/constants/nodeCategory'
import type { Node, NodeType } from '@/types/node'

const store = useNodesStore()
const findingsStore = useFindingsStore()
const { goToFinding } = useResourceNav()

function nodeVersion(annotations: Record<string, string>): string | undefined {
  const entry = Object.entries(annotations).find(([k]) => k.endsWith('/version') || k === 'version')
  return entry?.[1]
}

const search = ref('')
const activeTypes = ref<Set<string>>(new Set())
const allTypes = computed(() => [...new Set(store.nodes.map((n) => store.getTypeName(n)))])
const filteredNodes = computed(() =>
  store.nodes.filter((n) => {
    if (
      !matchesQuery(search.value, n.displayName, n.nodeId, n.nodeType?.nodeTypeId) &&
      !matchesAnnotations(search.value, n.annotations)
    )
      return false
    if (activeTypes.value.size > 0 && !activeTypes.value.has(store.getTypeName(n))) return false
    return true
  }),
)
const hasActiveFilters = computed(() => !!search.value || activeTypes.value.size > 0)
function toggleType(name: string) {
  activeTypes.value = toggledSet(activeTypes.value, name)
}
function clearFilters() {
  search.value = ''
  activeTypes.value = new Set()
}

// Selection
const {
  selectedId,
  selected: selectedNode,
  select: selectNode,
} = useResourceSelection<Node>({
  items: () => store.nodes,
  filtered: () => filteredNodes.value,
  idOf: (n) => n.nodeId,
  loadDetail: (id) => store.loadNodeDetail(id),
})

const selectedNodeTypeUnknown = computed(() => {
  const n = selectedNode.value
  if (!n) return false
  const cat = store.getTypeCategory(n)
  return !cat || cat === 'Unknown'
})

const relatedFindings = useFindingsForResource(() => findingsStore.findings, selectedId)

onMounted(() => {
  store.load()
  findingsStore.load()
})

// Node Types drawer
const typesDrawer = useTypesDrawer({
  types: () => store.nodeTypes,
  idOf: (t) => t.nodeTypeId,
  detail: () => store.selectedTypeDetail,
  load: store.loadNodeTypes,
  loadDetail: store.loadNodeTypeDetail,
  currentTypeId: () => selectedNode.value?.nodeType?.nodeTypeId,
})
const { open: typesDrawerOpen, selectedTypeId, selectedType } = typesDrawer

useListKeyboardNav(
  computed(() => filteredNodes.value.map((n) => n.nodeId)),
  selectedId,
  selectNode,
  typesDrawerOpen,
)
</script>

<template>
  <ResourceViewShell
    :loading="store.loading"
    loading-label="Loading nodes..."
    :error="store.error"
    :error-list-empty="store.nodes.length === 0"
  >
    <template #header>
      <ViewHeader
        title="Nodes"
        :count="store.nodes.length"
      >
        <template #actions>
          <button
            class="ml-auto flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1 text-meta transition-colors"
            :class="
              typesDrawerOpen
                ? 'bg-accent/10 text-accent-text'
                : 'text-text-3 hover:bg-bg-3 hover:text-text-1'
            "
            @click="typesDrawer.openDrawer()"
          >
            Node types
            <span
              v-if="store.typesLoaded"
              class="font-mono text-micro text-text-4"
            >
              {{ store.nodeTypes.length }}
            </span>
          </button>
        </template>
      </ViewHeader>
    </template>

    <!-- Toolbar -->
    <FilterToolbar
      v-model:search="search"
      placeholder="Search nodes, annotations... (/)"
      :has-active-filters="hasActiveFilters"
      @clear="clearFilters"
    >
      <FilterChipGroup
        label="Type"
        :items="allTypes"
        :active="activeTypes"
        @toggle="toggleType"
      />
    </FilterToolbar>
    <EmptyState
      v-if="filteredNodes.length === 0"
      title="No nodes"
      :hint="hasActiveFilters ? 'No results for current filters' : 'No nodes discovered yet'"
    />
    <!-- List-Detail -->
    <ListDetail v-else>
      <!-- List -->
      <template #list>
        <div class="flex h-full flex-col">
          <!-- list bar, so the column starts on the same line as the detail -->
          <ListPaneBar
            :count="filteredNodes.length"
            :total="store.nodes.length"
          />
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div
              v-for="node in filteredNodes"
              :key="node.nodeId"
              :data-row-id="node.nodeId"
              class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
              :class="
                node.nodeId === selectedId
                  ? 'border-l-accent bg-accent/5'
                  : 'border-l-transparent hover:bg-bg-1'
              "
              @click="selectNode(node.nodeId)"
            >
              <div
                class="truncate text-body font-medium text-text-1"
                :title="node.displayName"
              >
                {{ node.displayName }}
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded px-1.5 py-0.5 font-mono text-meta"
                  :class="categoryColorForNode(node)"
                >
                  {{ store.getTypeName(node) }}
                </span>
                <span
                  v-if="nodeVersion(node.annotations)"
                  class="font-mono text-meta text-text-id"
                >
                  {{ nodeVersion(node.annotations) }}
                </span>
                <span
                  v-if="findingsStore.findingCountFor(node.nodeId) > 0"
                  class="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
                  :title="`${findingsStore.findingCountFor(node.nodeId)} finding(s)`"
                >
                  <IconAlertTriangle
                    :size="10"
                    :stroke-width="2"
                  />
                  {{ findingsStore.findingCountFor(node.nodeId) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Detail -->
      <template #detail>
        <div
          v-if="selectedNode"
          class="@container flex-1 overflow-y-auto"
        >
          <div class="border-b border-border-1 px-6 py-4">
            <div class="flex items-start justify-between gap-4">
              <h2 class="text-title font-medium text-text-1">{{ selectedNode.displayName }}</h2>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-label text-text-id">{{ selectedNode.nodeId }}</span>
                <CopyButton
                  :value="selectedNode.nodeId"
                  :size="13"
                />
              </div>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button
                v-if="selectedNode.nodeType?.nodeTypeId"
                class="group inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-label transition-opacity hover:opacity-80"
                :class="categoryColorForNode(selectedNode)"
                title="Show node type"
                @click="typesDrawer.openType(selectedNode.nodeType.nodeTypeId)"
              >
                {{ store.getTypeName(selectedNode) }}
              </button>
              <span
                v-else
                class="rounded px-2 py-0.5 font-mono text-label"
                :class="categoryColorForNode(selectedNode)"
              >
                {{ store.getTypeName(selectedNode) }}
              </span>
              <span
                v-if="nodeVersion(selectedNode.annotations)"
                class="rounded bg-bg-2 px-2 py-0.5 font-mono text-label text-text-3"
              >
                {{ nodeVersion(selectedNode.annotations) }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-5 px-6 py-5">
            <DetailErrorBanner v-if="store.hasDetailError(selectedNode.nodeId)" />
            <div
              class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8 @3xl:[&>*:nth-child(3)]:border-l @3xl:[&>*:nth-child(3)]:border-border-1/50 @3xl:[&>*:nth-child(3)]:pl-8"
            >
              <div class="flex flex-col gap-6">
                <div>
                  <SectionLabel>Node type</SectionLabel>
                  <div class="flex flex-col gap-1 border-b border-border-1 py-2 last:border-b-0">
                    <span class="flex w-full items-center gap-3">
                      <span
                        class="flex w-28 shrink-0 items-center justify-center gap-1 rounded px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase"
                        :class="
                          selectedNodeTypeUnknown
                            ? 'bg-error/10 text-error'
                            : 'bg-accent/10 text-accent-text'
                        "
                      >
                        <IconAlertTriangle
                          v-if="selectedNodeTypeUnknown"
                          :size="12"
                          :stroke-width="2"
                        />
                        NodeType
                      </span>
                      <span
                        class="min-w-0 truncate text-body"
                        :class="selectedNodeTypeUnknown ? 'text-error' : 'text-text-2'"
                      >
                        {{ selectedNode.nodeType?.displayName || 'Unknown' }}
                      </span>
                    </span>
                    <span
                      v-if="selectedNodeTypeUnknown"
                      class="text-meta text-error/80"
                    >
                      References a node type that does not exist.
                    </span>
                    <span
                      v-else-if="store.getTypeForNode(selectedNode)?.description"
                      class="truncate text-meta text-text-3"
                    >
                      {{ store.getTypeForNode(selectedNode)?.description }}
                    </span>
                    <span
                      v-if="selectedNode.nodeType?.nodeTypeId"
                      class="flex items-center gap-1.5"
                    >
                      <span class="font-mono text-meta text-text-4">
                        {{ selectedNode.nodeType.nodeTypeId }}
                      </span>
                      <CopyButton
                        :value="selectedNode.nodeType.nodeTypeId"
                        :size="12"
                      />
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-6">
                <div>
                  <SectionLabel
                    :count="relatedFindings.length"
                    tone="warning"
                  >
                    Findings
                  </SectionLabel>
                  <p
                    v-if="relatedFindings.length === 0"
                    class="text-data leading-snug text-text-4"
                  >
                    No findings.
                  </p>
                  <FindingCard
                    v-for="f in relatedFindings"
                    :key="f.findingId"
                    :finding="f"
                    @open="goToFinding"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-6">
                <div>
                  <!-- Annotations -->
                  <SectionLabel :count="Object.keys(selectedNode.annotations).length">
                    Annotations
                  </SectionLabel>
                  <p
                    v-if="Object.keys(selectedNode.annotations).length === 0"
                    class="text-data leading-snug text-text-4"
                  >
                    No annotations.
                  </p>
                  <AnnotationsTable
                    v-else
                    :annotations="selectedNode.annotations"
                    layout="stacked"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-label text-text-id">Select a node to inspect</span>
        </div>
      </template>
    </ListDetail>

    <template #drawers>
      <!-- node types drawer -->
      <TypesDrawerShell
        :open="typesDrawerOpen"
        title="Node Types"
        subtitle="NodeType"
        :count="store.typesLoaded ? store.nodeTypes.length : undefined"
        :loading="store.typesLoading"
        :types="store.nodeTypes"
        :id-of="(t: NodeType) => t.nodeTypeId"
        :selected-id="selectedTypeId"
        :has-detail="!!selectedType"
        empty-label="Select a node type"
        @close="typesDrawer.close()"
        @select="typesDrawer.select"
      >
        <template #row="{ type }">
          <span
            class="rounded px-1.5 py-0.5 font-mono text-meta"
            :class="categoryColorForName(type.displayName)"
          >
            {{ type.displayName }}
          </span>
        </template>
        <template #detail>
          <template v-if="selectedType">
            <div class="flex items-center gap-2">
              <span
                class="rounded px-2 py-0.5 font-mono text-label"
                :class="categoryColorForName(selectedType.displayName)"
              >
                {{ selectedType.displayName }}
              </span>
              <span class="font-mono text-label text-text-id">{{ selectedType.nodeTypeId }}</span>
              <CopyButton
                :value="selectedType.nodeTypeId"
                :size="13"
              />
            </div>
            <p
              v-if="selectedType.description"
              class="mt-4 font-mono text-body leading-relaxed text-text-2"
            >
              {{ selectedType.description }}
            </p>
            <div
              v-if="Object.keys(selectedType.annotations).length > 0"
              class="mt-6"
            >
              <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
                Annotations
              </div>
              <div
                v-for="(value, key) in selectedType.annotations"
                :key="key"
                class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
                style="grid-template-columns: minmax(180px, 30%) minmax(0, 1fr)"
              >
                <span
                  class="truncate text-text-3"
                  :title="key"
                >
                  {{ key }}
                </span>
                <span class="break-all text-text-2">{{ value }}</span>
              </div>
            </div>
          </template>
        </template>
      </TypesDrawerShell>
    </template>
  </ResourceViewShell>
</template>
