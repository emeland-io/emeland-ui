<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useResourceNav } from '@/composables/useResourceNav'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useFindingsStore } from '@/stores/findings'
import { useNodesStore } from '@/stores/nodes'
import { useContextStore } from '@/stores/contexts'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useApiStore } from '@/stores/apis'
import { buildPaletteResults, type PaletteSourceItem, type PaletteItem } from '@/utils/palette'
import TypeChip from '@/components/TypeChip.vue'

const { open, toggle, close } = useCommandPalette()
const { goToResource } = useResourceNav()

const findingsStore = useFindingsStore()
const nodesStore = useNodesStore()
const contextStore = useContextStore()
const systemStore = useSystemStore()
const componentStore = useComponentStore()
const apiStore = useApiStore()

const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const closeEl = ref<HTMLElement | null>(null)
const resultsEl = ref<HTMLElement | null>(null)

watch(open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  activeIndex.value = 0
  void Promise.all([
    findingsStore.load(),
    nodesStore.load(),
    contextStore.load(),
    systemStore.load(),
    componentStore.load(),
    apiStore.load(),
  ])
  await nextTick()
  inputEl.value?.focus()
})

const source = computed<PaletteSourceItem[]>(() => [
  ...findingsStore.findings.map((f) => ({
    id: f.findingId,
    type: 'Finding' as const,
    label: f.displayName,
    description: f.description,
    annotations: f.annotations,
  })),
  ...systemStore.systems.map((s) => ({
    id: s.systemId,
    type: 'System' as const,
    label: s.displayName,
    description: s.description,
    annotations: s.annotations,
  })),
  ...componentStore.components.map((c) => ({
    id: c.componentId,
    type: 'Component' as const,
    label: c.displayName,
    description: c.description,
    annotations: c.annotations,
  })),
  ...apiStore.apis.map((a) => ({
    id: a.apiId,
    type: 'API' as const,
    label: a.displayName,
    description: a.description,
    annotations: a.annotations,
  })),
  ...contextStore.contexts.map((c) => ({
    id: c.contextId,
    type: 'Context' as const,
    label: c.displayName,
    description: c.description,
    annotations: c.annotations,
  })),
  ...nodesStore.nodes.map((n) => ({
    id: n.nodeId,
    type: 'Node' as const,
    label: n.displayName,
    description: n.description,
    annotations: n.annotations,
  })),
])

const groups = computed(() => buildPaletteResults(query.value, source.value))
const flat = computed(() => groups.value.flatMap((g) => g.items))
const indexOf = computed(() => new Map(flat.value.map((it, i) => [`${it.type}:${it.id}`, i])))

// clamp the walk when the result set shrinks
watch(flat, () => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(flat.value.length - 1, 0))
})

// DOM order of the result rows matches the flat list (groups and items are in
// flat order), so the nth row is the nth item
function rowOf(index: number): HTMLElement | undefined {
  return resultsEl.value?.querySelectorAll<HTMLElement>('[data-palette-item]')[index]
}

function openItem(item: PaletteItem) {
  close()
  goToResource(item.type, item.id)
}

function onKeydown(e: KeyboardEvent) {
  // ⌘K / Ctrl+K toggles from anywhere
  if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    e.stopImmediatePropagation()
    toggle()
    return
  }
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopImmediatePropagation()
    close()
    return
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    e.stopImmediatePropagation()
    const order = [inputEl.value, closeEl.value].filter(Boolean) as HTMLElement[]
    if (order.length === 0) return
    const i = order.indexOf(document.activeElement as HTMLElement)
    const next = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + order.length) % order.length
    order[next]?.focus()
    return
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopImmediatePropagation()
    const n = flat.value.length
    if (n === 0) return
    activeIndex.value =
      e.key === 'ArrowDown'
        ? Math.min(activeIndex.value + 1, n - 1)
        : Math.max(activeIndex.value - 1, 0)
    nextTick(() => rowOf(activeIndex.value)?.scrollIntoView({ block: 'nearest' }))
    return
  }
  if (e.key === 'Enter') {
    const item = flat.value[activeIndex.value]
    if (!item) return
    e.preventDefault()
    e.stopImmediatePropagation()
    openItem(item)
  }
}
useWindowKeydown(onKeydown)
</script>

<template>
  <Teleport to="body">
    <Transition name="palette-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        @click.self="close"
      >
        <div
          class="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border-1 bg-bg-0 shadow-2xl"
        >
          <!-- input -->
          <div class="flex items-center gap-2 border-b border-border-1 px-4 py-3">
            <IconSearch
              :size="14"
              :stroke-width="1.5"
              class="shrink-0 text-text-4"
            />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              placeholder="Jump to a finding, system, component, API, context, node..."
              class="min-w-0 flex-1 bg-transparent text-body text-text-1 outline-none placeholder:text-text-4"
            />
            <button
              ref="closeEl"
              class="flex h-7 w-7 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2 focus-visible:bg-bg-2"
              aria-label="Close"
              @click="close"
            >
              <IconX
                :size="16"
                :stroke-width="1.5"
              />
            </button>
          </div>

          <!-- results -->
          <div
            ref="resultsEl"
            class="min-h-0 flex-1 overflow-y-auto py-1"
          >
            <p
              v-if="!query.trim()"
              class="px-4 py-6 text-center text-meta text-text-4"
            >
              Type to search across findings, systems, components, APIs, contexts, and nodes
            </p>
            <p
              v-else-if="groups.length === 0"
              class="px-4 py-6 text-center text-meta text-text-4"
            >
              No matches for “{{ query }}”
            </p>
            <section
              v-for="g in groups"
              :key="g.type"
            >
              <div
                class="flex items-center justify-between px-4 pb-1 pt-2.5 text-micro font-medium uppercase tracking-wider text-text-4"
              >
                {{ g.label }}
                <span class="font-mono tabular-nums">
                  {{ g.total > g.items.length ? `${g.items.length} of ${g.total}` : g.total }}
                </span>
              </div>
              <div
                v-for="item in g.items"
                :key="`${item.type}:${item.id}`"
                data-palette-item
                class="cursor-pointer px-4 py-1.5 transition-colors"
                :class="indexOf.get(`${item.type}:${item.id}`) === activeIndex ? 'bg-bg-2' : ''"
                @mouseenter="activeIndex = indexOf.get(`${item.type}:${item.id}`)!"
                @click="openItem(item)"
              >
                <div class="flex items-center gap-2">
                  <TypeChip :type="item.type" />
                  <span
                    class="truncate text-body text-text-1"
                    :title="item.label"
                  >
                    {{ item.label }}
                  </span>
                </div>
                <div
                  v-if="item.description"
                  class="mt-0.5 truncate pl-7 text-meta text-text-3"
                  :title="item.description"
                >
                  {{ item.description }}
                </div>
              </div>
            </section>
          </div>

          <!-- footer -->
          <div
            class="flex items-center gap-4 border-t border-border-1 px-4 py-2 font-mono text-micro text-text-4"
          >
            <span>↑↓ walk</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-fade-enter-active,
.palette-fade-leave-active {
  transition: opacity 0.15s ease;
}

.palette-fade-enter-from,
.palette-fade-leave-to {
  opacity: 0;
}
</style>
