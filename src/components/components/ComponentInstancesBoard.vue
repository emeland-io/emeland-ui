<script setup lang="ts">
import { useSystemStore } from '@/stores/systems'
import { useInstanceContext } from '@/composables/useInstanceContext'
import InstancesBoard from '@/components/InstancesBoard.vue'
import TypeChip from '@/components/TypeChip.vue'
import type { ComponentInstance } from '@/types/component'

withDefaults(
  defineProps<{
    instances: ComponentInstance[]
    activeInstanceId?: string
  }>(),
  { activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const systemStore = useSystemStore()
const { contextForInstance } = useInstanceContext()

function systemInstanceName(id: string): string | undefined {
  return systemStore.systemInstanceMap.get(id)?.displayName
}
</script>

<template>
  <InstancesBoard
    :instances="instances"
    :id-of="(i) => i.componentInstanceId"
    :ctx-of="contextForInstance"
    :search-fields="(i) => [systemInstanceName(i.systemInstance)]"
    :active-instance-id="activeInstanceId"
    @select="(id) => emit('select', id)"
  >
    <template #card-extra="{ inst }">
      <span
        v-if="systemInstanceName(inst.systemInstance)"
        class="flex max-w-[45%] shrink-0 items-baseline gap-1 font-mono text-micro text-text-4"
        :title="systemInstanceName(inst.systemInstance)"
      >
        <TypeChip type="SystemInstance" />
        <span class="truncate">{{ systemInstanceName(inst.systemInstance) }}</span>
      </span>
    </template>
    <template #list-extra="{ inst }">
      <span
        v-if="systemInstanceName(inst.systemInstance)"
        class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-4"
      >
        <TypeChip type="SystemInstance" />
        {{ systemInstanceName(inst.systemInstance) }}
      </span>
    </template>
  </InstancesBoard>
</template>
