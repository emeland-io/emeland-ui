<script setup lang="ts">
import { computed } from 'vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useResourceNav } from '@/composables/useResourceNav'
import { useDrawerNav } from '@/composables/useDrawerNav'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import MappingTag from '@/components/MappingTag.vue'
import RelationRow from '@/components/RelationRow.vue'
import DrawerIdRow from '@/components/drawer/DrawerIdRow.vue'
import DrawerAnnotationsSection from '@/components/drawer/DrawerAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import { endpointUrl } from '@/utils/endpoint'
import { mappingStateOf } from '@/utils/mapping'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
  navIds?: string[]
}>()

const emit = defineEmits<{
  close: []
  navigate: [id: string]
  'nav-exit': [step: number]
}>()

const store = useApiStore()
const systemStore = useSystemStore()
const contextStore = useContextStore()
const { contextIdForSystemInstance } = useInstanceContext()
const { goToResource } = useResourceNav()

const instance = computed(() =>
  store.apiInstances.find((i) => i.apiInstanceId === props.selectedInstanceId),
)

// an instance is "unmapped" when its parent API is missing or unresolvable
const apiResolvable = computed(() => !!instance.value?.api && store.apiMap.has(instance.value.api))

const mappingState = computed(() =>
  instance.value ? mappingStateOf(instance.value.api, apiResolvable.value) : undefined,
)

const apiName = computed(() =>
  instance.value?.api ? store.apiMap.get(instance.value.api)?.displayName : undefined,
)

const url = computed(() => (instance.value ? endpointUrl(instance.value.annotations) : undefined))

const systemInstance = computed(() => {
  const id = instance.value?.systemInstance
  if (!id) return undefined
  return systemStore.systemInstanceMap.get(id)
})

const contextId = computed(() =>
  instance.value ? contextIdForSystemInstance(instance.value.systemInstance) : undefined,
)

const context = computed(() => {
  const id = contextId.value
  if (!id) return undefined
  return contextStore.contextMap.get(id)
})

const contextType = computed(() => {
  if (!context.value) return undefined
  const type = contextStore.getTypeName(context.value)
  return type === 'Unknown' ? undefined : type
})

function navigate(type: 'API' | 'System' | 'Context', id: string) {
  emit('close')
  goToResource(type, id)
}

const { navIndex, step: stepInstance } = useDrawerNav({
  navIds: () => props.navIds,
  current: () => props.selectedInstanceId,
  onNavigate: (id) => emit('navigate', id),
  onExit: (step) => emit('nav-exit', step),
})
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="instance?.displayName ?? 'Instance'"
    subtitle="ApiInstance"
    :nav-index="navIndex >= 0 ? navIndex : undefined"
    :nav-count="navIndex >= 0 ? navIds?.length : undefined"
    @close="emit('close')"
    @nav-prev="stepInstance(-1)"
    @nav-next="stepInstance(1)"
  >
    <template #header-tags>
      <MappingTag :state="mappingState" />
    </template>
    <div
      v-if="instance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <!-- identity -->
      <div>
        <DrawerIdRow
          label="Instance ID"
          :value="instance.apiInstanceId"
        />
        <DrawerIdRow
          label="Endpoint"
          :value="url"
          empty-label="no endpoint declared"
          empty-title="No emeland.io/endpoint.host annotation — not a probe target"
        />
        <WellKnownAnnotationsTable
          :annotations="instance.annotations"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <!-- owning API -->
      <div v-if="instance.api">
        <SectionLabel>API</SectionLabel>
        <RelationRow
          :id="instance.api"
          badge="API"
          fixed-badge
          :badge-tone="apiResolvable ? 'accent' : 'error'"
          :name="apiResolvable ? (apiName ?? instance.api) : 'Unresolved API'"
          :name-tone="apiResolvable ? 'default' : 'error'"
          :clickable="apiResolvable"
          title="Go to API"
          @click="navigate('API', instance.api!)"
        />
      </div>

      <!-- system instance -->
      <div v-if="instance.systemInstance">
        <SectionLabel>System instance</SectionLabel>
        <RelationRow
          :id="instance.systemInstance"
          badge="Instance"
          fixed-badge
          :name="systemInstance?.displayName ?? instance.systemInstance"
          :clickable="!!systemInstance?.system"
          title="Go to system"
          @click="navigate('System', systemInstance!.system)"
        />
      </div>

      <!-- context -->
      <div v-if="contextId">
        <SectionLabel>Context</SectionLabel>
        <RelationRow
          :id="contextId"
          :badge="contextType"
          :name="context?.displayName ?? 'Unresolved context'"
          :name-tone="context ? 'default' : 'error'"
          :clickable="!!context"
          title="Go to context"
          @click="navigate('Context', contextId!)"
        />
      </div>

      <!-- annotations -->
      <DrawerAnnotationsSection :annotations="instance.annotations" />
    </div>

    <DetailEmptyState
      v-else
      label="Instance not found"
    />
  </SlideOverDrawer>
</template>
