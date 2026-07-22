<script setup lang="ts">
import { computed } from 'vue'
import { IconStack2, IconArrowUpRight } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import { useResourceNav } from '@/composables/useResourceNav'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
}>()

const emit = defineEmits<{
  close: []
  'go-to-system': [id: string]
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

const drawerInstance = computed(() =>
  store.systemInstances.find((i) => i.systemInstanceId === props.selectedInstanceId),
)
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="drawerInstance?.displayName ?? 'System instance'"
    @close="emit('close')"
  >
    <template #icon>
      <IconStack2
        :size="18"
        :stroke-width="1.5"
        class="text-accent"
      />
    </template>
    <div
      v-if="drawerInstance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <!-- identity -->
      <div>
        <div
          class="grid gap-4 border-b border-border-1 py-1.5 text-data"
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
        <button
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to system"
          @click="emit('go-to-system', drawerInstance.system)"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            System
          </span>
          <span
            class="max-w-full truncate text-body text-text-2 transition-colors group-hover:text-accent"
          >
            {{ store.systemMap.get(drawerInstance.system)?.displayName ?? drawerInstance.system }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ drawerInstance.system }}</span>
            <CopyButton
              :value="drawerInstance.system"
              :size="12"
              @click.stop
            />
          </div>
        </button>
      </div>

      <!-- context -->
      <div v-if="drawerInstance.context">
        <SectionLabel>Context</SectionLabel>
        <button
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to context"
          @click="goToContext(drawerInstance.context)"
        >
          <span
            v-if="contextType(drawerInstance.context)"
            class="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            {{ contextType(drawerInstance.context) }}
          </span>
          <span
            class="max-w-full truncate text-body text-text-2 transition-colors group-hover:text-accent"
          >
            {{ contextName(drawerInstance.context) ?? drawerInstance.context }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ drawerInstance.context }}</span>
            <CopyButton
              :value="drawerInstance.context"
              :size="12"
              @click.stop
            />
          </div>
        </button>
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
