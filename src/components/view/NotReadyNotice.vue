<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IconBarrierBlock } from '@tabler/icons-vue'
import { useNavEntry } from '@/composables/useNavigation'

/**
 * Centered "this view isn't built yet" notice
 */
const route = useRoute()
const entry = useNavEntry()

const title = computed(() => entry.value?.item.label ?? String(route.name ?? 'This view'))

const hint = computed(() => {
  const section = entry.value?.section
  if (!section) return 'This part of the app is still being built.'
  return section.phase
    ? `Planned for the ${section.title} area (${section.phase}).`
    : `Planned for the ${section.title} area.`
})
</script>

<template>
  <div class="flex flex-1 items-center justify-center">
    <div class="text-center">
      <IconBarrierBlock
        :size="32"
        :stroke-width="1.5"
        class="mx-auto text-text-4"
      />
      <p class="mt-3 text-body text-text-2">{{ title }} isn't ready yet</p>
      <p class="mt-1 text-label text-text-4">{{ hint }}</p>
    </div>
  </div>
</template>
