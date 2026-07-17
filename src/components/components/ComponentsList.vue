<script setup lang="ts">
import { IconArrowUp, IconArrowDown } from '@tabler/icons-vue'
import { useSystemStore } from '@/stores/systems'
import type { Component } from '@/types/component'

defineProps<{
  components: Component[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const systemStore = useSystemStore()

function systemName(id: string): string | undefined {
  return systemStore.systemMap.get(id)?.displayName
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
    <div class="text-sm font-medium text-text-1">{{ comp.displayName }}</div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        v-if="systemName(comp.system)"
        class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-[11px] text-text-3"
      >
        {{ systemName(comp.system) }}
      </span>
      <span
        v-if="comp.version?.version"
        class="font-mono text-[11px] text-text-4"
      >
        v{{ comp.version.version }}
      </span>
      <span
        v-if="comp.provides.length || comp.consumes.length"
        class="ml-auto flex shrink-0 items-center gap-1"
        :title="`provides ${comp.provides.length}, consumes ${comp.consumes.length} API(s)`"
      >
        <span
          v-if="comp.provides.length"
          class="flex items-center gap-0.5 rounded-full bg-bg-2 px-1.5 py-0.5 font-mono text-[10px] text-text-3"
        >
          <IconArrowUp
            :size="11"
            :stroke-width="2"
          />
          {{ comp.provides.length }}
        </span>
        <span
          v-if="comp.consumes.length"
          class="flex items-center gap-0.5 rounded-full bg-bg-2 px-1.5 py-0.5 font-mono text-[10px] text-text-3"
        >
          <IconArrowDown
            :size="11"
            :stroke-width="2"
          />
          {{ comp.consumes.length }}
        </span>
      </span>
    </div>
  </div>
</template>
