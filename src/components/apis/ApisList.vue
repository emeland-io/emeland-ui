<script setup lang="ts">
import { computed } from 'vue'
import { IconAlertTriangle, IconArrowsExchange } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import MappingTag from '@/components/MappingTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import { endpointUrl } from '@/utils/endpoint'
import { mappingStateOf, groupByBrokenRef } from '@/utils/mapping'
import type { Api, ApiInstance } from '@/types/api'

const props = withDefaults(
  defineProps<{
    apis: Api[]
    selectedId: string
    /** apiId -> number of boundary crossings (contexts consumed in but not provided in) */
    crossings?: Map<string, number>
    /** instances without a resolvable parent API, shown in their own section */
    unmapped?: ApiInstance[]
    /** keep the unmapped section expanded (e.g. while a search is active) */
    forceExpanded?: boolean
    /** fold the main rows away (e.g. to focus on the unmapped section) */
    listCollapsed?: boolean
    /** instance currently shown in the drawer, marked with an accent indicator */
    activeInstanceId?: string
  }>(),
  {
    crossings: () => new Map<string, number>(),
    unmapped: () => [],
    forceExpanded: false,
    listCollapsed: false,
    activeInstanceId: '',
  },
)

const emit = defineEmits<{
  select: [id: string]
  'open-instance': [id: string]
}>()

const store = useApiStore()
const systemStore = useSystemStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()

// group the section by the system instance
const unmappedGroups = computed(() =>
  groupByBrokenRef(
    props.unmapped,
    (i) => i.systemInstance,
    'No system instance',
    (key) => systemStore.systemInstanceMap.get(key)?.displayName,
    (key) => systemStore.systemInstanceMap.has(key),
  ),
)

function groupTitle(key: string): string {
  if (!key) return 'No system instance'
  return systemStore.systemInstanceMap.has(key) ? key : `References missing system instance ${key}`
}

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
}

function findingCount(id: string): number {
  return findingsStore.findingCountFor(id)
}

function instanceCount(id: string): number {
  return store.getInstancesForApi(id).length
}

function instanceContext(inst: ApiInstance): string | undefined {
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? contextStore.contextMap.get(ctxId)?.displayName : undefined
}

function mappingState(inst: ApiInstance) {
  return mappingStateOf(inst.api, store.apiMap.has(inst.api ?? ''))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <div
      v-for="api in apis"
      :key="api.apiId"
      :data-row-id="api.apiId"
      class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
      :class="[
        api.apiId === selectedId
          ? 'border-l-accent bg-accent/5'
          : 'border-l-transparent hover:bg-bg-1',
      ]"
      @click="emit('select', api.apiId)"
    >
      <div
        class="truncate text-body font-medium text-text-1"
        :title="api.displayName"
      >
        {{ api.displayName }}
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta"
          :class="api.type === 'Unknown' ? 'text-text-4' : 'text-text-3'"
        >
          {{ api.type }}
        </span>
        <span
          v-if="systemName(api.system)"
          class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
        >
          {{ systemName(api.system) }}
        </span>
        <span
          v-if="api.version?.version"
          class="font-mono text-meta text-text-4"
        >
          v{{ api.version.version }}
        </span>
        <span class="ml-auto flex shrink-0 items-center gap-1.5">
          <span
            v-if="crossings.has(api.apiId)"
            class="flex shrink-0 items-center gap-1 rounded-full border border-border-2 bg-bg-2 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-3"
            title="Crosses a context boundary"
          >
            <IconArrowsExchange
              :size="10"
              :stroke-width="2"
            />
            {{ crossings.get(api.apiId) }}
          </span>
          <span
            v-if="findingCount(api.apiId) > 0"
            class="flex shrink-0 items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro tabular-nums text-warning"
            :title="`${findingCount(api.apiId)} finding(s)`"
          >
            <IconAlertTriangle
              :size="10"
              :stroke-width="2"
            />
            {{ findingCount(api.apiId) }}
          </span>
          <span
            v-if="store.instancesLoaded && instanceCount(api.apiId) > 0"
            class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
            :title="`${instanceCount(api.apiId)} instance(s)`"
          >
            <svg
              width="14"
              height="9"
              viewBox="0 0 14 9"
              class="shrink-0"
              aria-hidden="true"
            >
              <polygon
                points="0,0 10,0 14,4 14,9 0,9"
                fill="var(--color-text-3)"
              />
            </svg>
            {{ instanceCount(api.apiId) }}
          </span>
        </span>
      </div>
    </div>
  </template>

  <!-- instances without a resolvable parent API -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.apiInstanceId"
    :group-key-of="(i) => i.systemInstance || ''"
    :group-title="groupTitle"
    :force-expanded="forceExpanded"
    :active-instance-id="activeInstanceId"
    @open="(id) => emit('open-instance', id)"
  >
    <template #meta="{ inst }">
      <MappingTag :state="mappingState(inst)" />
      <span
        v-if="instanceContext(inst)"
        class="shrink-0 font-mono text-meta text-text-4"
      >
        {{ instanceContext(inst) }}
      </span>
      <span
        v-if="endpointUrl(inst.annotations)"
        class="ml-auto min-w-0 truncate font-mono text-meta text-text-3"
        :title="endpointUrl(inst.annotations)"
      >
        {{ endpointUrl(inst.annotations) }}
      </span>
    </template>
  </UnmappedSection>
</template>
