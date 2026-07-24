<script setup lang="ts">
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import type { Component } from '@/types/component'

defineProps<{
  components: Component[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const systemStore = useSystemStore()
const store = useComponentStore()

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
}

function instanceCount(id: string): number {
  return store.getInstancesForComponent(id).length
}
</script>

<template>
  <div
    v-for="comp in components"
    :key="comp.componentId"
    class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
    :class="
      comp.componentId === selectedId
        ? 'border-l-accent bg-accent/5'
        : 'border-l-transparent hover:bg-bg-1'
    "
    @click="emit('select', comp.componentId)"
  >
    <div class="text-body font-medium text-text-1">{{ comp.displayName }}</div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        v-if="systemName(comp.system)"
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-meta text-text-3"
      >
        {{ systemName(comp.system) }}
      </span>
      <span
        v-if="comp.version?.version"
        class="font-mono text-meta text-text-4"
      >
        v{{ comp.version.version }}
      </span>
      <span
        v-if="store.instancesLoaded && instanceCount(comp.componentId) > 0"
        class="ml-auto flex shrink-0 items-center gap-1 font-mono text-micro text-text-3"
        :title="`${instanceCount(comp.componentId)} instance(s)`"
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
            fill="var(--color-text-4)"
          />
        </svg>
        {{ instanceCount(comp.componentId) }}
      </span>
    </div>
  </div>
</template>
