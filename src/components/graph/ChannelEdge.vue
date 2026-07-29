<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, getSmoothStepPath, Position } from '@vue-flow/core'

/*
edge whose vertical segment runs in its own "lane"
*/
const props = withDefaults(
  defineProps<{
    id: string
    sourceX: number
    sourceY: number
    targetX: number
    targetY: number
    sourcePosition?: Position
    targetPosition?: Position
    markerEnd?: string
    data?: { lane?: number }
  }>(),
  {
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    markerEnd: '',
    data: () => ({}),
  },
)

defineOptions({ inheritAttrs: false })

const PAD = 12 // minimum horizontal stub length at both ends

const path = computed(() => {
  const mid = (props.sourceX + props.targetX) / 2
  let centerX = mid
  if (props.targetX - props.sourceX > PAD * 2) {
    const laneX = mid + (props.data?.lane ?? 0)
    centerX = Math.min(Math.max(laneX, props.sourceX + PAD), props.targetX - PAD)
  }
  return getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    centerX,
    offset: 8,
    borderRadius: 5,
  })[0]
})
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path"
    :marker-end="markerEnd"
  />
</template>
