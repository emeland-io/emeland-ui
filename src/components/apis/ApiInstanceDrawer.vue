<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useContextStore } from '@/stores/contexts'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { useResourceNav } from '@/composables/useResourceNav'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import WellKnownAnnotationsTable from '@/components/WellKnownAnnotationsTable.vue'
import MappingTag from '@/components/MappingTag.vue'
import { endpointUrl } from '@/utils/endpoint'
import { mappingStateOf } from '@/utils/mapping'

const props = defineProps<{
  open: boolean
  selectedInstanceId: string
}>()

const emit = defineEmits<{
  close: []
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
  return systemStore.systemInstances.find((si) => si.systemInstanceId === id)
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
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="instance?.displayName ?? 'Instance'"
    subtitle="ApiInstance"
    @close="emit('close')"
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
        <div
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug"
          style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
        >
          <span class="text-text-3">Instance ID</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="break-all text-text-2">
              {{ instance.apiInstanceId }}
            </span>
            <CopyButton
              :value="instance.apiInstanceId"
              :size="12"
            />
          </span>
        </div>
        <div
          class="grid gap-4 border-b border-border-1 py-0.5 text-data leading-snug last:border-b-0"
          style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
        >
          <span class="text-text-3">Endpoint</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span
              v-if="url"
              class="break-all text-text-2"
            >
              {{ url }}
            </span>
            <span
              v-else
              class="text-text-4"
              title="No emeland.io/endpoint.host annotation — not a probe target"
            >
              no endpoint declared
            </span>
            <CopyButton
              v-if="url"
              :value="url"
              :size="12"
            />
          </span>
        </div>
        <WellKnownAnnotationsTable
          :annotations="instance.annotations"
          columns="minmax(160px, 30%) minmax(0, 1fr)"
        />
      </div>

      <!-- owning API -->
      <div v-if="instance.api">
        <SectionLabel>API</SectionLabel>
        <button
          v-if="apiResolvable"
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          title="Go to API"
          @click="navigate('API', instance.api!)"
        >
          <span
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
          >
            API
          </span>
          <span
            class="max-w-full truncate text-body text-text-2 transition-colors group-hover:text-accent"
          >
            {{ apiName ?? instance.api }}
          </span>
          <IconArrowUpRight
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ instance.api }}</span>
            <CopyButton
              :value="instance.api!"
              :size="12"
              @click.stop
            />
          </div>
        </button>
        <div
          v-else
          class="flex w-full items-center gap-3 border-b border-border-1 py-2 last:border-b-0"
        >
          <span
            class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
          >
            API
          </span>
          <span class="max-w-full truncate text-body text-error">Unresolved API</span>
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ instance.api }}</span>
            <CopyButton
              :value="instance.api!"
              :size="12"
            />
          </div>
        </div>
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
            class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
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
      <div v-if="contextId">
        <SectionLabel>Context</SectionLabel>
        <component
          :is="context ? 'button' : 'div'"
          class="group flex w-full items-center gap-3 border-b border-border-1 py-2 text-left last:border-b-0"
          :title="context ? 'Go to context' : undefined"
          @click="context && navigate('Context', contextId!)"
        >
          <span
            v-if="contextType"
            class="shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
          >
            {{ contextType }}
          </span>
          <span
            class="max-w-full truncate text-body transition-colors"
            :class="[context ? 'text-text-2 group-hover:text-accent' : 'text-error']"
          >
            {{ context?.displayName ?? 'Unresolved context' }}
          </span>
          <IconArrowUpRight
            v-if="context"
            :size="16"
            :stroke-width="2"
            class="shrink-0 text-text-4 transition-colors group-hover:text-accent"
          />
          <div class="ml-auto flex shrink-0 items-center gap-1.5">
            <span class="font-mono text-meta text-text-4">{{ contextId }}</span>
            <CopyButton
              :value="contextId!"
              :size="12"
              @click.stop
            />
          </div>
        </component>
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
