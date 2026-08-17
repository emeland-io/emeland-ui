<script setup lang="ts">
import { useContextStore } from '@/stores/contexts'
import InstancesBoard from '@/components/InstancesBoard.vue'
import type { ResolvedContext } from '@/composables/useInstanceContext'
import type { SystemInstance } from '@/types/system'

withDefaults(
  defineProps<{
    instances: SystemInstance[]
    activeInstanceId?: string
  }>(),
  { activeInstanceId: '' },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const contextStore = useContextStore()

// System instances carry their context directly (SystemInstance.context).
function resolveContext(inst: SystemInstance): ResolvedContext {
  const id = inst.context
  if (!id) return { unresolved: false }
  const c = contextStore.contextMap.get(id)
  if (!c) return { id, unresolved: true }
  return { id, name: c.displayName, unresolved: false }
}
</script>

<template>
  <InstancesBoard
    :instances="instances"
    :id-of="(i) => i.systemInstanceId"
    :ctx-of="resolveContext"
    :active-instance-id="activeInstanceId"
    @select="(id) => emit('select', id)"
  />
</template>
