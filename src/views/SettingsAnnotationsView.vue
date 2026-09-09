<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '@/components/CopyButton.vue'
import FilterToolbar from '@/components/toolbar/FilterToolbar.vue'
import EmptyState from '@/components/view/EmptyState.vue'
import { matchesAnnotations, matchesQuery } from '@/utils/search'
import { WELL_KNOWN_ANNOTATIONS, type WellKnownAnnotation } from '@/utils/annotations'

const search = ref('')
const hasActiveFilters = computed(() => !!search.value.trim())

function clearFilters() {
  search.value = ''
}

const groups = computed(() => {
  const byCategory = new Map<string, WellKnownAnnotation[]>()
  for (const def of WELL_KNOWN_ANNOTATIONS) {
    if (
      !matchesQuery(search.value, def.suffix, def.label, def.purpose, def.appliesTo) &&
      !matchesAnnotations(search.value, { category: def.category })
    )
      continue
    const list = byCategory.get(def.category) ?? []
    list.push(def)
    byCategory.set(def.category, list)
  }
  return [...byCategory.entries()].map(([category, defs]) => ({
    category,
    defs: [...defs].sort((a, b) => a.suffix.localeCompare(b.suffix)),
  }))
})

function fullKey(def: WellKnownAnnotation): string {
  return `emeland.io/${def.suffix}`
}
</script>

<template>
  <FilterToolbar
    v-model:search="search"
    placeholder="Search keys, labels, purposes... (/)"
    :has-active-filters="hasActiveFilters"
    @clear="clearFilters"
  />

  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto max-w-5xl px-6 py-6">
      <h2 class="text-title font-medium text-text-1">Well-known annotations</h2>
      <p class="mt-1 text-body text-text-3">
        Annotation keys the backend and UI recognize. Everything else on a resource is a free-form
        custom annotation.
      </p>

      <EmptyState
        v-if="groups.length === 0"
        title="No annotations"
        :hint="hasActiveFilters ? 'No entries match the filter' : 'No well-known annotations'"
      />

      <template v-else>
        <section
          v-for="group in groups"
          :key="group.category"
          class="mt-8"
        >
          <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
            {{ group.category }}
          </div>
          <div
            class="grid gap-4 border-b border-border-1 py-2 text-meta text-text-4"
            style="
              grid-template-columns:
                minmax(180px, 26%) minmax(120px, 14%) minmax(0, 30%) minmax(150px, 18%)
                minmax(120px, 12%);
            "
          >
            <span>Key</span>
            <span>Label</span>
            <span>Purpose</span>
            <span>Example</span>
            <span>Applies to</span>
          </div>
          <div
            v-for="def in group.defs"
            :key="def.suffix"
            class="grid gap-4 border-b border-border-1 py-2 text-data"
            style="
              grid-template-columns:
                minmax(180px, 26%) minmax(120px, 14%) minmax(0, 30%) minmax(150px, 18%)
                minmax(120px, 12%);
            "
          >
            <span class="flex min-w-0 items-center gap-1.5 break-all font-mono text-text-2">
              {{ fullKey(def) }}
              <CopyButton
                :value="fullKey(def)"
                :size="12"
              />
            </span>
            <span class="text-text-2">{{ def.label }}</span>
            <span class="break-words text-text-3">{{ def.purpose }}</span>
            <span class="break-all font-mono text-meta text-text-4">{{ def.example }}</span>
            <span class="text-text-3">{{ def.appliesTo }}</span>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
