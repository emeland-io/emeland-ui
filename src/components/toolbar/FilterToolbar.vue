<script setup lang="ts">
import { IconSearch, IconX } from '@tabler/icons-vue'

defineProps<{
  placeholder: string
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  clear: []
}>()

const search = defineModel<string>('search', { required: true })
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
    <!-- Search -->
    <div
      class="flex items-center gap-2 rounded bg-bg-2 px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
      style="min-width: 300px"
    >
      <IconSearch
        :size="13"
        :stroke-width="1.5"
        class="shrink-0 text-text-4"
      />
      <input
        v-model="search"
        type="text"
        data-search-input
        :placeholder="placeholder"
        class="w-full bg-transparent font-mono text-label text-text-2 outline-none placeholder:text-meta placeholder:text-text-4"
      />
      <button
        v-if="search"
        class="shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-3 hover:text-text-2"
        title="Clear search"
        @click="search = ''"
      >
        <IconX
          :size="12"
          :stroke-width="2"
        />
      </button>
    </div>

    <!-- Filter chip groups -->
    <slot />

    <!-- Clear -->
    <button
      v-if="hasActiveFilters"
      class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1 text-meta text-text-3 transition-colors hover:bg-bg-3 hover:text-text-1"
      @click="emit('clear')"
    >
      <IconX
        :size="11"
        :stroke-width="2"
      />
      Clear
    </button>
  </div>
</template>
