<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight, IconArrowUp, IconArrowDown } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useContextStore } from '@/stores/contexts'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useResourceNav } from '@/composables/useResourceNav'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const contextStore = useContextStore()
const { contextForInstance } = useInstanceContext()
const { goToResource } = useResourceNav()

const instance = computed(() =>
  store.componentInstances.find((i) => i.componentInstanceId === props.selectedInstanceId),
)

const componentName = computed(() =>
  instance.value ? store.componentMap.get(instance.value.component)?.displayName : undefined,
)

const systemInstance = computed(() => {
  const id = instance.value?.systemInstance
  if (!id) return undefined
  return systemStore.systemInstances.find((si) => si.systemInstanceId === id)
})

const context = computed(() => (instance.value ? contextForInstance(instance.value) : undefined))

const contextType = computed(() => {
  const id = context.value?.id
  if (!id) return undefined
  const ctx = contextStore.contextMap.get(id)
  if (!ctx) return undefined
  const type = contextStore.getTypeName(ctx)
  return type === 'Unknown' ? undefined : type
})

const provides = computed(() =>
  (instance.value?.provides ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
const consumes = computed(() =>
  (instance.value?.consumes ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)

function navigate(type: 'Component' | 'System' | 'Context', id: string) {
  emit('close')
  goToResource(type, id)
}
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="instance?.displayName ?? 'Instance'"
    subtitle="ComponentInstance"
    @close="emit('close')"
  >
    <div
      v-if="instance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <!-- identity -->
      <div>
        <div
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug"
          style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
        >
          <span class="text-text-3">Instance ID</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="break-all text-text-2">
              {{ instance.componentInstanceId }}
            </span>
            <CopyButton
              :value="instance.componentInstanceId"
              :size="12"
            />
          </span>
        </div>
        <WellKnownAnnotationsTable
          :annotations="instance.annotations"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <!-- owning component -->
      <div v-if="instance.component">
        <SectionLabel>Component</SectionLabel>
        <button
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to component"
          @click="navigate('Component', instance.component)"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            Component
          </span>
          <span
            class="max-w-full truncate text-body text-text-2 transition-colors group-hover:text-accent"
          >
            {{ componentName ?? instance.component }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ instance.component }}</span>
            <CopyButton
              :value="instance.component"
              :size="12"
              @click.stop
            />
          </div>
        </button>
      </div>

      <!-- system instance -->
      <div v-if="instance.systemInstance">
        <SectionLabel>System instance</SectionLabel>
        <component
          :is="systemInstance?.system ? 'button' : 'div'"
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          :title="systemInstance?.system ? 'Go to system' : undefined"
          @click="systemInstance?.system && navigate('System', systemInstance.system)"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            Instance
          </span>
          <span
            class="max-w-full truncate text-body text-text-2 transition-colors"
            :class="systemInstance?.system ? 'group-hover:text-accent' : ''"
          >
            {{ systemInstance?.displayName ?? instance.systemInstance }}
          </span>
          <IconArrowUpRight
            v-if="systemInstance?.system"
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ instance.systemInstance }}</span>
            <CopyButton
              :value="instance.systemInstance"
              :size="12"
              @click.stop
            />
          </div>
        </component>
      </div>

      <!-- context -->
      <div v-if="context?.id">
        <SectionLabel>Context</SectionLabel>
        <button
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to context"
          @click="navigate('Context', context.id)"
        >
          <span
            v-if="contextType"
            class="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent"
          >
            {{ contextType }}
          </span>
          <span
            class="max-w-full truncate text-body transition-colors group-hover:text-accent"
            :class="context.unresolved ? 'text-error' : 'text-text-2'"
          >
            {{ context.name ?? (context.unresolved ? 'Unresolved context' : context.id) }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ context.id }}</span>
            <CopyButton
              :value="context.id"
              :size="12"
              @click.stop
            />
          </div>
        </button>
      </div>

      <!-- provides -->
      <div v-if="provides.length">
        <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in provides"
            :key="api.id"
            class="flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent"
          >
            <IconArrowUp
              :size="11"
              :stroke-width="2"
            />
            {{ api.name }}
          </span>
        </div>
      </div>

      <!-- consumes -->
      <div v-if="consumes.length">
        <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in consumes"
            :key="api.id"
            class="flex items-center gap-1 rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
          >
            <IconArrowDown
              :size="11"
              :stroke-width="2"
            />
            {{ api.name }}
          </span>
        </div>
      </div>

      <!-- annotations -->
      <div v-if="Object.keys(instance.annotations).length">
        <SectionLabel>Annotations</SectionLabel>
        <AnnotationsTable
          :annotations="instance.annotations"
          columns="minmax(180px, 30%) minmax(0, 1fr)"
        />
      </div>
    </div>

    <div
      v-else
      class="flex flex-1 items-center justify-center"
    >
      <span class="font-mono text-label text-text-4">Instance not found</span>
    </div>
  </SlideOverDrawer>
</template>
