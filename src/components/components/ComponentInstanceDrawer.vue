<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useContextLabels } from '@/composables/useContextLabels'
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
import ApiChipCloud from '@/components/apis/ApiChipCloud.vue'
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

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const { contextForInstance } = useInstanceContext()
const { goToResource } = useResourceNav()

const instance = computed(() =>
  store.componentInstances.find((i) => i.componentInstanceId === props.selectedInstanceId),
)

const mappingState = computed(() =>
  instance.value
    ? mappingStateOf(instance.value.component, store.componentMap.has(instance.value.component))
    : undefined,
)

const componentName = computed(() =>
  instance.value ? store.componentMap.get(instance.value.component)?.displayName : undefined,
)

const systemInstance = computed(() => {
  const id = instance.value?.systemInstance
  if (!id) return undefined
  return systemStore.systemInstanceMap.get(id)
})

const context = computed(() => (instance.value ? contextForInstance(instance.value) : undefined))

const { contextType } = useContextLabels()

const provides = computed(() =>
  (instance.value?.provides ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
const consumes = computed(() =>
  (instance.value?.consumes ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)

function navigate(type: 'Component' | 'System' | 'Context' | 'API', id: string) {
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
    subtitle="ComponentInstance"
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
          :value="instance.componentInstanceId"
        />
        <WellKnownAnnotationsTable
          :annotations="instance.annotations"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <!-- owning component -->
      <div v-if="instance.component">
        <SectionLabel>Component</SectionLabel>
        <RelationRow
          :id="instance.component"
          badge="Component"
          fixed-badge
          :name="componentName ?? instance.component"
          clickable
          title="Go to component"
          @click="navigate('Component', instance.component)"
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
      <div v-if="context?.id">
        <SectionLabel>Context</SectionLabel>
        <RelationRow
          :id="context.id"
          :badge="contextType(context.id)"
          :name="context.name ?? (context.unresolved ? 'Unresolved context' : context.id)"
          :name-tone="context.unresolved ? 'error' : 'default'"
          clickable
          title="Go to context"
          @click="navigate('Context', context!.id!)"
        />
      </div>

      <!-- provides -->
      <div v-if="provides.length">
        <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
        <ApiChipCloud
          :apis="provides"
          direction="up"
          size="meta"
          mark-relations
          @open="navigate('API', $event)"
        />
      </div>

      <!-- consumes -->
      <div v-if="consumes.length">
        <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
        <ApiChipCloud
          :apis="consumes"
          tone="muted"
          direction="down"
          size="meta"
          mark-relations
          @open="navigate('API', $event)"
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
