<script setup lang="ts">
import { computed } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'

const props = defineProps<{
  search: string
  kinds: readonly string[]
  activeKinds: Set<string>
  contexts: { id: string; name: string }[]
  activeContexts: Set<string>
  hasActiveFilters: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-kind': [kind: string]
  'toggle-context': [id: string]
  clear: []
}>()

const searchModel = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
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
        v-model="searchModel"
        type="text"
        placeholder="Search systems, IDs, annotations..."
        class="w-full bg-transparent font-mono text-label text-text-2 outline-none placeholder:text-meta placeholder:text-text-4"
      />
      <button
        v-if="search"
        class="shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-3 hover:text-text-2"
        title="Clear search"
        @click="emit('update:search', '')"
      >
        <IconX
          :size="12"
          :stroke-width="2"
        />
      </button>
    </div>
    <div class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1">
      <span
        class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
      >
        Kind
      </span>
      <button
        v-for="kind in kinds"
        :key="kind"
        class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          activeKinds.has(kind)
            ? 'bg-accent/10 text-accent-text'
            : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        @click="emit('toggle-kind', kind)"
      >
        {{ kind }}
      </button>
    </div>
    <div
      v-if="contexts.length > 0"
      class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1"
    >
      <span
        class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
      >
        Context
      </span>
      <button
        v-for="ctx in contexts"
        :key="ctx.id"
        class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          activeContexts.has(ctx.id)
            ? 'bg-accent/10 text-accent-text'
            : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        @click="emit('toggle-context', ctx.id)"
      >
        {{ ctx.name }}
      </button>
    </div>
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
