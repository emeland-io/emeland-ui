<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNavEntry } from '@/composables/useNavigation'
import ViewHeader from '@/components/view/ViewHeader.vue'
import NotReadyNotice from '@/components/view/NotReadyNotice.vue'
import TypeChip from '@/components/TypeChip.vue'

/**
 * Stand-in for views whose backend resources do not exist yet
 */
const route = useRoute()
const entry = useNavEntry()

const title = computed(() => entry.value?.item.label ?? String(route.name ?? 'Coming soon'))
</script>

<template>
  <div class="flex h-full flex-col">
    <ViewHeader :title="title">
      <TypeChip
        v-if="entry"
        :type="entry.item.type"
        :letter="entry.item.chip"
        :label="entry.item.label"
      />
    </ViewHeader>

    <NotReadyNotice />
  </div>
</template>
