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
 */
import { computed } from 'vue'
import type { ResourceType } from '@/types/common'
import { chipLetterFor, resourceLabel } from '@/constants/resources'

const props = defineProps<{
  type?: ResourceType
  letter?: string
  label?: string
}>()

const chip = computed(() => (props.type ? chipLetterFor(props.type) : (props.letter ?? '?')))
const title = computed(() => (props.type ? resourceLabel(props.type) : (props.label ?? '')))
</script>

<template>
  <span
    class="inline-flex w-5 shrink-0 items-center justify-center rounded-sm bg-bg-3 font-mono text-micro text-text-3"
    :title="title"
  >
    {{ chip }}
  </span>
</template>
