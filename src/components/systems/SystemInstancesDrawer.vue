<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import MappingTag from '@/components/MappingTag.vue'
import RelationRow from '@/components/RelationRow.vue'
import { mappingStateOf } from '@/utils/mapping'
import { useResourceNav } from '@/composables/useResourceNav'
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
const contextStore = useContextStore()
const { goToResource } = useResourceNav()

function contextName(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  return contextStore.contextMap.get(contextId)?.displayName
}

function contextType(contextId: string | undefined): string | undefined {
  if (!contextId) return undefined
  const ctx = contextStore.contextMap.get(contextId)
  if (!ctx) return undefined
  const type = contextStore.getTypeName(ctx)
  return type === 'Unknown' ? undefined : type
}

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
        <div
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug"
          style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
        >
          <span class="font-mono text-text-3">Instance ID</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="break-all font-mono text-text-2">
              {{ drawerInstance.systemInstanceId }}
            </span>
            <CopyButton
              :value="drawerInstance.systemInstanceId"
              :size="12"
            />
          </span>
        </div>
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
      <div v-if="Object.keys(drawerInstance.annotations).length > 0">
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
      <span class="font-mono text-label text-text-4">No instance selected</span>
    </div>
  </SlideOverDrawer>
</template>
