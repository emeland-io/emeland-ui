<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { IconListDetails, IconLoader2, IconArrowUpRight } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import { buildInstanceGraph } from '@/graph/instanceGraph'
import type { GraphNodeClick } from '@/types/graph'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
  'go-to-system': [id: string]
}>()

// only loaded when the graph view is first opened
const FlowGraph = defineAsyncComponent(() => import('@/components/graph/FlowGraph.vue'))

const store = useSystemStore()
const contextStore = useContextStore()

const view = ref<'list' | 'graph'>('list')

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

const graphModel = computed(() =>
  buildInstanceGraph({
    systems: store.systems,
    instancesOf: store.getInstancesForSystem,
    contextName,
  }),
)

function onGraphNodeClick({ id, kind }: GraphNodeClick) {
  if (kind === 'instance') {
    emit('select', id)
    view.value = 'list'
  } else if (kind === 'system') {
    emit('go-to-system', id)
  }
}

const groups = computed(() =>
  store.systems
    .map((s) => ({ system: s, instances: store.getInstancesForSystem(s.systemId) }))
    .filter((g) => g.instances.length > 0),
)

const drawerInstance = computed(() =>
  store.systemInstances.find((i) => i.systemInstanceId === props.selectedInstanceId),
)
</script>

<template>
  <SlideOverDrawer
    :open="open"
    title="System Instances"
    size="wide"
    :count="store.instancesLoaded ? store.systemInstances.length : undefined"
    @close="emit('close')"
  >
    <template #icon>
      <IconListDetails
        :size="16"
        :stroke-width="1.5"
        class="text-text-3"
      />
    </template>
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- view toggle -->
      <div class="flex items-center gap-1 border-b border-border-1 px-4 py-1.5">
        <span class="mr-1 text-[11px] text-text-4">View</span>
        <button
          class="rounded px-2 py-0.5 font-mono text-[11px] transition-colors"
          :class="
            view === 'list'
              ? 'bg-accent/10 text-accent-text'
              : 'text-text-4 hover:bg-bg-2 hover:text-text-3'
          "
          @click="view = 'list'"
        >
          List
        </button>
        <button
          class="rounded px-2 py-0.5 font-mono text-[11px] transition-colors"
          :class="
            view === 'graph'
              ? 'bg-accent/10 text-accent-text'
              : 'text-text-4 hover:bg-bg-2 hover:text-text-3'
          "
          @click="view = 'graph'"
        >
          Graph
        </button>
      </div>
      <div
        v-if="store.instancesLoading"
        class="flex flex-1 items-center justify-center"
      >
        <div class="flex items-center gap-2 text-text-3">
          <IconLoader2
            :size="16"
            :stroke-width="1.5"
            class="animate-spin"
          />
          <span class="text-sm">Loading instances...</span>
        </div>
      </div>
      <!-- Graph view -->
      <FlowGraph
        v-else-if="view === 'graph'"
        :nodes="graphModel.nodes"
        :edges="graphModel.edges"
        :selected-id="selectedInstanceId"
        class="min-h-0 flex-1"
        @node-click="onGraphNodeClick"
      />
      <!-- List view -->
      <div
        v-else
        class="flex min-h-0 flex-1 overflow-hidden"
      >
        <!-- Instance list  -->
        <div class="w-72 shrink-0 overflow-y-auto border-r border-border-1">
          <div
            v-for="group in groups"
            :key="group.system.systemId"
          >
            <!-- system group header -->
            <div
              class="sticky top-0 z-10 flex items-center gap-2 border-b border-border-1 bg-bg-0 px-4 py-1.5"
            >
              <span class="truncate text-[11px] font-semibold uppercase tracking-wide text-text-3">
                {{ group.system.displayName }}
              </span>
              <span class="ml-auto shrink-0 font-mono text-[10px] text-text-4">
                {{ group.instances.length }}
              </span>
            </div>
            <!-- instances of this system -->
            <div
              v-for="inst in group.instances"
              :key="inst.systemInstanceId"
              class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-2.5 transition-colors"
              :class="
                inst.systemInstanceId === selectedInstanceId
                  ? 'border-l-accent bg-accent/5'
                  : 'border-l-transparent hover:bg-bg-1'
              "
              @click="emit('select', inst.systemInstanceId)"
            >
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-text-1">{{ inst.displayName }}</span>
                <span
                  v-if="contextName(inst.context)"
                  class="ml-auto shrink-0 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent"
                >
                  {{ contextName(inst.context) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <!-- Instance detail -->
        <div
          v-if="drawerInstance"
          class="flex-1 overflow-y-auto px-6 py-5"
        >
          <div class="flex items-center gap-2">
            <h3 class="text-base font-medium text-text-1">{{ drawerInstance.displayName }}</h3>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <span class="font-mono text-xs text-text-4">{{ drawerInstance.systemInstanceId }}</span>
            <CopyButton
              :value="drawerInstance.systemInstanceId"
              :size="13"
            />
          </div>
          <!-- owning system -->
          <div
            v-if="drawerInstance.system"
            class="mt-6"
          >
            <SectionLabel>System</SectionLabel>
            <button
              class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to system"
              @click="emit('go-to-system', drawerInstance.system)"
            >
              <span
                class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-[11px] font-semibold uppercase text-accent"
              >
                System
              </span>
              <span
                class="max-w-full truncate text-sm text-text-2 transition-colors group-hover:text-accent"
              >
                {{
                  store.systemMap.get(drawerInstance.system)?.displayName ?? drawerInstance.system
                }}
              </span>
              <IconArrowUpRight
                :size="16"
                :stroke-width="2"
                class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
              />
            </button>
          </div>
          <!-- context -->
          <div
            v-if="contextName(drawerInstance.context)"
            class="mt-6"
          >
            <SectionLabel>Context</SectionLabel>
            <span class="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
              {{ contextName(drawerInstance.context) }}
            </span>
          </div>
          <!-- annotations -->
          <div
            v-if="Object.keys(drawerInstance.annotations).length > 0"
            class="mt-6"
          >
            <SectionLabel>Annotations</SectionLabel>
            <AnnotationsTable
              :annotations="drawerInstance.annotations"
              columns="minmax(180px, 30%) minmax(0, 1fr)"
            />
          </div>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center"
        >
          <span class="font-mono text-xs text-text-4">Select a system instance</span>
        </div>
      </div>
    </div>
  </SlideOverDrawer>
</template>
