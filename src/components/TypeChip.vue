<script setup lang="ts">
/**
 * The letter chip for a resource type, used across the app (command palette
 * results, graph node sub-lines, graph legends, instance boards):
 * [S] system, [C] context, [A] API, ... Letters live with the rest of the
 * per-resource metadata in `constants/resources.ts`
 *
 *   <TypeChip type="System" />
 *
 * For things that have no `ResourceType` yet (sidebar entries for views whose
 * backend resource does not exist so far) pass the letters explicitly:
 *
 *   <TypeChip letter="Me" label="Metrics" />
 *
 * `instance` renders the chip with the cut-corner motif of the graph's instance
 * nodes, keeping the parent resource's letter, so `<TypeChip type="API"
 * instance />` reads as "an API instance" ([A] in an instance-shaped chip).
 */
import { computed } from 'vue'
import type { ResourceType } from '@/types/common'
import { chipLetterFor, resourceLabel } from '@/constants/resources'

const props = defineProps<{
  type?: ResourceType
  letter?: string
  label?: string
  instance?: boolean
}>()

const chip = computed(() => (props.type ? chipLetterFor(props.type) : (props.letter ?? '?')))
const title = computed(() => {
  const base = props.type ? resourceLabel(props.type) : (props.label ?? '')
  return props.instance ? `${base} instance` : base
})
</script>

<template>
  <span
    class="inline-flex w-5 shrink-0 items-center justify-center bg-bg-3 font-mono text-micro text-text-3"
    :class="instance ? 'type-chip-instance' : 'rounded-sm'"
    :title="title"
  >
    {{ chip }}
  </span>
</template>

<style scoped>
.type-chip-instance {
  clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
}
</style>
