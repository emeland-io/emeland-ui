<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { IconPlus, IconTrash } from '@tabler/icons-vue'
import { WELL_KNOWN_ANNOTATIONS, type WellKnownAnnotation } from '@/utils/annotations'

interface Row {
  key: string
  value: string
}

const props = defineProps<{
  modelValue: Record<string, string>
  resourceType?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const rows = ref<Row[]>([{ key: '', value: '' }])
let syncing = false

const openIndex = ref<number | null>(null)
const highlight = ref(0)
const openUp = ref(false)
const keyInputEls = ref<(HTMLInputElement | null)[]>([])

const MENU_MAX_HEIGHT = 224 // max-h-56
const MENU_GAP = 4

function appliesToResourceType(appliesTo: string, kind: string | undefined): boolean {
  const normalized = appliesTo.trim().toLowerCase()
  if (!normalized || normalized === 'any resource') return true
  if (!kind) return true
  return normalized
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .includes(kind.toLowerCase())
}

function usedKeysExcept(index: number): Set<string> {
  return new Set(
    rows.value
      .filter((_, i) => i !== index)
      .map((r) => r.key.trim())
      .filter(Boolean),
  )
}

function suggestionsFor(index: number): WellKnownAnnotation[] {
  const q = (rows.value[index]?.key ?? '').trim().toLowerCase()
  const used = usedKeysExcept(index)
  return WELL_KNOWN_ANNOTATIONS.filter((def) => {
    if (!appliesToResourceType(def.appliesTo, props.resourceType)) return false
    if (used.has(def.key)) return false
    if (!q) return true
    return (
      def.key.toLowerCase().includes(q) ||
      def.suffix.toLowerCase().includes(q) ||
      def.label.toLowerCase().includes(q) ||
      def.purpose.toLowerCase().includes(q)
    )
  }).slice(0, 8)
}

const openSuggestions = computed(() =>
  openIndex.value === null ? [] : suggestionsFor(openIndex.value),
)

function rowsFromMap(map: Record<string, string>): Row[] {
  const entries = Object.entries(map)
  return entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]
}

function mapFromRows(list: Row[]): Record<string, string> {
  const next: Record<string, string> = {}
  for (const row of list) {
    const k = row.key.trim()
    if (!k) continue
    next[k] = row.value
  }
  return next
}

watch(
  () => props.modelValue,
  (map) => {
    if (syncing) return
    rows.value = rowsFromMap(map)
  },
  { immediate: true, deep: true },
)

function commit() {
  syncing = true
  emit('update:modelValue', mapFromRows(rows.value))
  queueMicrotask(() => {
    syncing = false
  })
}

function openMenu(index: number) {
  const el = keyInputEls.value[index]
  if (el) {
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    openUp.value = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow
  } else {
    openUp.value = false
  }
  openIndex.value = index
  highlight.value = 0
}

function closeMenu() {
  openIndex.value = null
  highlight.value = 0
  openUp.value = false
}

function pickSuggestion(index: number, def: WellKnownAnnotation) {
  const row = rows.value[index]
  if (!row) return
  row.key = def.key
  closeMenu()
  commit()
  void nextTick(() => keyInputEls.value[index]?.blur())
}

function onKeyInput(index: number) {
  openMenu(index)
}

function onKeyFocus(index: number) {
  openMenu(index)
}

function onKeyBlur(index: number) {
  // defer so option mousedown can run first
  window.setTimeout(() => {
    if (openIndex.value === index) closeMenu()
    commit()
  }, 120)
}

function onKeyDown(index: number, e: KeyboardEvent) {
  const list = suggestionsFor(index)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    openMenu(index)
    highlight.value = Math.min(highlight.value + 1, Math.max(list.length - 1, 0))
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlight.value = Math.max(highlight.value - 1, 0)
    return
  }
  if (e.key === 'Enter' && openIndex.value === index && list[highlight.value]) {
    e.preventDefault()
    pickSuggestion(index, list[highlight.value]!)
    return
  }
  if (e.key === 'Escape') {
    closeMenu()
  }
}

function addRow() {
  rows.value.push({ key: '', value: '' })
}

function removeRow(index: number) {
  rows.value.splice(index, 1)
  if (!rows.value.length) rows.value.push({ key: '', value: '' })
  closeMenu()
  commit()
}

onBeforeUnmount(() => closeMenu())
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex items-start gap-2"
    >
      <div class="relative min-w-0 flex-1">
        <input
          :ref="(el) => (keyInputEls[index] = el as HTMLInputElement | null)"
          v-model="row.key"
          class="h-8 w-full rounded border border-border-1 bg-bg-0 px-2 font-mono text-data text-text-1 placeholder:text-text-4 focus:border-border-2 focus:outline-none"
          placeholder="annotation key"
          spellcheck="false"
          autocomplete="off"
          role="combobox"
          :aria-expanded="openIndex === index"
          aria-autocomplete="list"
          @input="onKeyInput(index)"
          @focus="onKeyFocus(index)"
          @blur="onKeyBlur(index)"
          @keydown="onKeyDown(index, $event)"
        />

        <ul
          v-if="openIndex === index && openSuggestions.length"
          class="absolute left-0 z-20 max-h-56 w-[min(100%,22rem)] overflow-y-auto rounded border border-border-1 bg-bg-1 py-1 shadow-lg"
          :class="openUp ? 'bottom-full mb-1' : 'top-full mt-1'"
          role="listbox"
        >
          <li
            v-for="(def, si) in openSuggestions"
            :key="def.key"
            role="option"
            class="cursor-pointer px-2.5 py-1.5"
            :class="si === highlight ? 'bg-bg-2' : 'hover:bg-bg-2'"
            :aria-selected="si === highlight"
            @mousedown.prevent="pickSuggestion(index, def)"
            @mouseenter="highlight = si"
          >
            <div class="truncate font-mono text-meta text-text-1">
              {{ def.key }}
            </div>
            <div class="truncate text-micro text-text-3">
              {{ def.label }}
              <span class="text-text-4">· {{ def.purpose }}</span>
            </div>
          </li>
        </ul>
      </div>

      <input
        v-model="row.value"
        class="h-8 min-w-0 flex-[1.4] rounded border border-border-1 bg-bg-0 px-2 font-mono text-data text-text-1 placeholder:text-text-4 focus:border-border-2 focus:outline-none"
        placeholder="value"
        spellcheck="false"
        @change="commit"
        @blur="commit"
      />
      <button
        type="button"
        class="mt-0 flex h-8 w-8 shrink-0 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
        title="Remove annotation"
        aria-label="Remove annotation"
        @click="removeRow(index)"
      >
        <IconTrash
          :size="14"
          :stroke-width="1.5"
        />
      </button>
    </div>
    <button
      type="button"
      class="inline-flex h-7 w-fit items-center gap-1.5 rounded px-2 text-meta text-text-3 transition-colors hover:bg-bg-2 hover:text-text-1"
      @click="addRow"
    >
      <IconPlus
        :size="13"
        :stroke-width="1.75"
      />
      Add annotation
    </button>
  </div>
</template>
