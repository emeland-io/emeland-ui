<script setup lang="ts">
/**
 * Letter chip for a metric instance's subject. Instance types render as their
 * parent's letter in the cut-corner instance shape
 */
import { computed } from 'vue'
import TypeGlyph from '@/components/TypeGlyph.vue'
import { instanceParentType } from '@/constants/resources'
import type { ResourceType } from '@/types/common'

const props = defineProps<{ type: ResourceType }>()

const parent = computed(() => instanceParentType(props.type))
</script>

<template>
  <TypeGlyph
    :type="parent ?? type"
    :instance="!!parent"
  />
</template>
