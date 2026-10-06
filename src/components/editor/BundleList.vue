<script setup lang="ts">
import { IconAlertCircle, IconTrash } from '@tabler/icons-vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
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
  clear: []
}>()

function isInvalid(item: BundleItem): boolean {
  return !validateDocument(item.document).ok
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <ListPaneBar
      label="Bundle"
      :count="items.length"
      :total="items.length"
    >
      <template
        v-if="items.length"
        #actions
      >
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-micro font-medium text-text-4 transition-colors hover:bg-bg-3 hover:text-text-2"
          title="Remove all documents from the bundle"
          @click="emit('clear')"
        >
          Remove all
        </button>
      </template>
    </ListPaneBar>

    <div
      v-if="!items.length"
      class="px-4 py-3 text-meta text-text-4"
    >
      No documents yet. Validate a draft, then add it to the bundle.
    </div>

    <div
      v-else
      class="min-h-0 flex-1 overflow-y-auto"
      aria-label="Bundle documents"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative"
      >
        <ResourceListRow
          :id="item.id"
          :title="documentLabel(item.document)"
          :selected="selectedId === item.id"
          compact
          @select="emit('select', $event)"
        >
          <span class="truncate text-micro text-text-4">
            {{ documentBundleMeta(item.document) }}
          </span>
          <template #badges>
            <IconAlertCircle
              v-if="isInvalid(item)"
              :size="12"
              :stroke-width="2"
              class="shrink-0 text-error"
              title="Has validation issues"
            />
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center rounded text-text-4 opacity-0 transition-opacity hover:bg-bg-3 hover:text-text-2 group-hover:opacity-100 focus:opacity-100"
              title="Remove from bundle"
              aria-label="Remove from bundle"
              @click.stop="emit('remove', item.id)"
            >
              <IconTrash
                :size="12"
                :stroke-width="1.5"
              />
            </button>
          </template>
        </ResourceListRow>
      </div>
    </div>
  </div>
</template>
