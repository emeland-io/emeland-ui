<script setup lang="ts">
import { IconAlertCircle, IconTrash } from '@tabler/icons-vue'
import {
  documentBundleMeta,
  documentLabel,
  validateDocument,
  type BundleItem,
} from '@/editor/document'

defineProps<{
  items: BundleItem[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
}>()

function isInvalid(item: BundleItem): boolean {
  return !validateDocument(item.document).ok
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="shrink-0 border-b border-border-1 px-3 py-2 text-meta font-semibold uppercase tracking-widest text-text-4">
      Bundle
      <span
        v-if="items.length"
        class="ml-1 font-mono normal-case tracking-normal text-text-3"
      >
        ({{ items.length }})
      </span>
    </div>

    <div
      v-if="!items.length"
      class="px-3 py-4 text-meta text-text-4"
    >
      No documents yet. Validate a draft, then add it to the bundle.
    </div>

    <ul
      v-else
      class="min-h-0 flex-1 overflow-y-auto p-1.5"
      aria-label="Bundle documents"
    >
      <li
        v-for="item in items"
        :key="item.id"
      >
        <div
          class="group flex items-stretch gap-0.5 rounded"
          :class="
            selectedId === item.id
              ? 'bg-accent/10'
              : 'hover:bg-bg-1'
          "
        >
          <button
            type="button"
            class="min-w-0 flex-1 rounded px-2.5 py-1.5 text-left transition-colors"
            :class="
              selectedId === item.id ? 'text-accent-text' : 'text-text-3 hover:text-text-1'
            "
            @click="emit('select', item.id)"
          >
            <div class="flex items-center gap-1.5">
              <span class="truncate text-meta font-medium">
                {{ documentLabel(item.document) }}
              </span>
              <IconAlertCircle
                v-if="isInvalid(item)"
                :size="12"
                :stroke-width="2"
                class="shrink-0 text-error"
                title="Has validation issues"
              />
            </div>
            <span class="block truncate text-micro opacity-70">
              {{ documentBundleMeta(item.document) }}
            </span>
          </button>
          <button
            type="button"
            class="flex h-auto w-7 shrink-0 items-center justify-center rounded text-text-4 opacity-0 transition-opacity hover:text-text-2 group-hover:opacity-100 focus:opacity-100"
            title="Remove from bundle"
            aria-label="Remove from bundle"
            @click.stop="emit('remove', item.id)"
          >
            <IconTrash
              :size="13"
              :stroke-width="1.5"
            />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
