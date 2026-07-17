<script setup lang="ts">
import { computed } from 'vue'
import { IconStack2, IconArrowUp, IconArrowDown } from '@tabler/icons-vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useInstanceContext } from '@/composables/useInstanceContext'
import { instanceMeta } from '@/utils/instanceMeta'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'

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
const { contextForInstance } = useInstanceContext()

const instance = computed(() =>
  store.componentInstances.find((i) => i.componentInstanceId === props.selectedInstanceId),
)

const componentName = computed(() =>
  instance.value ? store.componentMap.get(instance.value.component)?.displayName : undefined,
)

function systemInstanceName(id: string): string | undefined {
  return systemStore.systemInstances.find((si) => si.systemInstanceId === id)?.displayName
}

const meta = computed(() => (instance.value ? instanceMeta(instance.value) : {}))

const detailRows = computed(() => {
  const inst = instance.value
  if (!inst) return [] as { label: string; value: string; copy?: boolean }[]
  const rows: { label: string; value: string; copy?: boolean }[] = [
    { label: 'Instance ID', value: inst.componentInstanceId, copy: true },
  ]
  if (componentName.value) rows.push({ label: 'Component', value: componentName.value })
  if (inst.systemInstance) {
    const name = systemInstanceName(inst.systemInstance)
    if (name) rows.push({ label: 'System instance', value: name })
    rows.push({ label: 'System instance ID', value: inst.systemInstance, copy: true })
  }
  const c = contextForInstance(inst)
  if (c.name) rows.push({ label: 'Context', value: c.name })
  if (c.id) rows.push({ label: 'Context ID', value: c.id, copy: true })
  if (meta.value.namespace) rows.push({ label: 'Namespace', value: meta.value.namespace })
  if (meta.value.lastUpdate) rows.push({ label: 'Last update', value: meta.value.lastUpdate })
  return rows
})

const provides = computed(() =>
  (instance.value?.provides ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
const consumes = computed(() =>
  (instance.value?.consumes ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="instance?.displayName ?? 'Instance'"
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
      v-if="instance"
      class="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4"
    >
      <div>
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="grid gap-4 border-b border-border-1 py-1.5 text-sm last:border-b-0"
          style="grid-template-columns: minmax(160px, 30%) minmax(0, 1fr)"
        >
          <span class="font-mono text-text-3">{{ row.label }}</span>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="break-all font-mono text-text-2">{{ row.value }}</span>
            <CopyButton
              v-if="row.copy"
              :value="row.value"
              :size="12"
            />
          </span>
        </div>
      </div>

      <div v-if="provides.length">
        <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in provides"
            :key="api.id"
            class="flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent"
          >
            <IconArrowUp
              :size="11"
              :stroke-width="2"
            />
            {{ api.name }}
          </span>
        </div>
      </div>

      <div v-if="consumes.length">
        <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="api in consumes"
            :key="api.id"
            class="flex items-center gap-1 rounded bg-bg-2 px-1.5 py-0.5 font-mono text-[11px] text-text-3"
          >
            <IconArrowDown
              :size="11"
              :stroke-width="2"
            />
            {{ api.name }}
          </span>
        </div>
      </div>

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
      <span class="font-mono text-xs text-text-4">Instance not found</span>
    </div>
  </SlideOverDrawer>
</template>
