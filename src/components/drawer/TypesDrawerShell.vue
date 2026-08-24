<script setup lang="ts" generic="T">
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import LoadingState from '@/components/view/LoadingState.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'

/**
 * Shared shell of the three "types" drawers (context/node/finding types):
 * drawer chrome, loading gate, the selectable type list (row content via the
 * `row` slot) and the detail pane (`detail` slot) with an empty fallback
 */
withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle: string
    count?: number
    loading?: boolean
    types: T[]
    idOf: (type: T) => string
    selectedId: string
    /** a type detail is currently selected */
    hasDetail: boolean
    /** fallback label, e.g. "Select a context type" */
    emptyLabel: string
    listWidth?: string
    rowClass?: string
  }>(),
  {
    count: undefined,
    loading: false,
    listWidth: 'w-52',
    rowClass: 'px-4 py-2.5',
  },
)

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()
</script>

<template>
  <SlideOverDrawer
    :open="open"
    :title="title"
    :subtitle="subtitle"
    :count="count"
    @close="emit('close')"
  >
    <LoadingState
      v-if="loading"
      label="Loading types..."
    />
    <template v-else>
      <!-- Type list -->
      <div
        class="shrink-0 overflow-y-auto border-r border-border-1"
        :class="listWidth"
      >
        <div
          v-for="type in types"
          :key="idOf(type)"
          :data-row-id="idOf(type)"
          class="cursor-pointer border-b border-border-1 border-l-2 transition-colors"
          :class="[
            rowClass,
            idOf(type) === selectedId
              ? 'border-l-accent bg-accent/5'
              : 'border-l-transparent hover:bg-bg-1',
          ]"
          @click="emit('select', idOf(type))"
        >
          <slot
            name="row"
            :type="type"
            :selected="idOf(type) === selectedId"
          />
        </div>
      </div>
      <!-- Type detail -->
      <div
        v-if="hasDetail"
        class="flex-1 overflow-y-auto px-6 py-5"
      >
        <slot name="detail" />
      </div>
      <DetailEmptyState
        v-else
        :label="emptyLabel"
      />
    </template>
  </SlideOverDrawer>
</template>
