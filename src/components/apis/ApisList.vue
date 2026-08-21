<script setup lang="ts">
import { IconArrowsExchange } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useSystemInstanceGroups } from '@/composables/useUnmappedGroups'
import MappingTag from '@/components/MappingTag.vue'
import TypeTag from '@/components/TypeTag.vue'
import UnmappedSection from '@/components/UnmappedSection.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import FindingsBadge from '@/components/list/FindingsBadge.vue'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'
import { endpointUrl } from '@/utils/endpoint'
import { mappingStateOf } from '@/utils/mapping'
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
const findingsStore = useFindingsStore()
const { contextForInstance } = useInstanceContext()

// group the section by the system instance
const { unmappedGroups, unmappedGroupTitle } = useSystemInstanceGroups(
  () => props.unmapped,
  (i) => i.systemInstance,
  (i) => i.apiInstanceId,
)

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
  return contextForInstance(inst).name
}

function mappingState(inst: ApiInstance) {
  return mappingStateOf(inst.api, store.apiMap.has(inst.api ?? ''))
}
</script>

<template>
  <template v-if="!listCollapsed">
    <ResourceListRow
      v-for="api in apis"
      :id="api.apiId"
      :key="api.apiId"
      :title="api.displayName"
      :selected="api.apiId === selectedId"
      @select="emit('select', $event)"
    >
      <TypeTag tone="muted">{{ api.type }}</TypeTag>
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
      <template #badges>
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
        <FindingsBadge :count="findingCount(api.apiId)" />
        <InstanceCountBadge
          v-if="store.instancesLoaded"
          :count="instanceCount(api.apiId)"
          :title="`${instanceCount(api.apiId)} instance(s)`"
        />
      </template>
    </ResourceListRow>
  </template>

  <!-- instances without a resolvable parent API -->
  <UnmappedSection
    :groups="unmappedGroups"
    :id-of="(i) => i.apiInstanceId"
    :group-key-of="(i) => i.systemInstance || ''"
    :group-title="unmappedGroupTitle"
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
