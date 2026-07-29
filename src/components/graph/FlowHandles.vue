<script setup lang="ts">
import { Handle, type Position } from '@vue-flow/core'

/**
 * Renders one connection handle per edge, spread evenly along the node side,
 * so parallel edges attach at distinct points instead of overlapping.
 */
defineProps<{
  type: 'source' | 'target'
  position: Position
  handles: string[]
}>()
</script>

<template>
  <Handle
    v-for="(h, i) in handles"
    :id="h"
    :key="h"
    :type="type"
    :position="position"
    :style="{ top: `${((i + 1) / (handles.length + 1)) * 100}%` }"
  />
</template>
