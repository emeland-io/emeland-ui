<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import MappingTag from '@/components/MappingTag.vue'
import RelationRow from '@/components/RelationRow.vue'
import DrawerIdRow from '@/components/drawer/DrawerIdRow.vue'
import DrawerAnnotationsSection from '@/components/drawer/DrawerAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import { mappingStateOf } from '@/utils/mapping'
import { useResourceNav } from '@/composables/useResourceNav'
import { useContextLabels } from '@/composables/useContextLabels'
import { useDrawerNav } from '@/composables/useDrawerNav'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
  navIds?: string[]
}>()

const emit = defineEmits<{
  close: []
  'go-to-system': [id: string]
  navigate: [id: string]
  'nav-exit': [step: number]
}>()

const store = useSystemStore()
const { contextName, contextType } = useContextLabels()
const { goToResource } = useResourceNav()

function goToContext(id: string) {
  emit('close')
  goToResource('Context', id)
}

const drawerInstance = computed(() => store.systemInstanceMap.get(props.selectedInstanceId))

const mappingState = computed(() =>
  drawerInstance.value
    ? mappingStateOf(drawerInstance.value.system, store.systemMap.has(drawerInstance.value.system))
    : undefined,
)

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
    :title="drawerInstance?.displayName ?? 'System instance'"
    subtitle="SystemInstance"
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
      v-if="drawerInstance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <!-- identity -->
      <div>
        <DrawerIdRow
          label="Instance ID"
          :value="drawerInstance.systemInstanceId"
        />
        <WellKnownAnnotationsTable
          :annotations="drawerInstance.annotations"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <!-- owning system -->
      <div v-if="drawerInstance.system">
        <SectionLabel>System</SectionLabel>
        <RelationRow
          :id="drawerInstance.system"
          badge="System"
          fixed-badge
          :name="store.systemMap.get(drawerInstance.system)?.displayName ?? drawerInstance.system"
          clickable
          title="Go to system"
          @click="emit('go-to-system', drawerInstance!.system)"
        />
      </div>

      <!-- context -->
      <div v-if="drawerInstance.context">
        <SectionLabel>Context</SectionLabel>
        <RelationRow
          :id="drawerInstance.context"
          :badge="contextType(drawerInstance.context)"
          :name="contextName(drawerInstance.context) ?? drawerInstance.context"
          clickable
          title="Go to context"
          @click="goToContext(drawerInstance!.context!)"
        />
      </div>

      <!-- annotations -->
      <DrawerAnnotationsSection :annotations="drawerInstance.annotations" />
    </div>
    <DetailEmptyState
      v-else
      label="No instance selected"
    />
  </SlideOverDrawer>
</template>
