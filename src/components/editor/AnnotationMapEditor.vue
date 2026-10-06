<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { IconChevronDown, IconPlus, IconTrash } from '@tabler/icons-vue'
import { WELL_KNOWN_ANNOTATIONS, type WellKnownAnnotation } from '@/utils/annotations'
import EditorDropdownPanel from '@/components/editor/EditorDropdownPanel.vue'
import EditorDropdownOption from '@/components/editor/EditorDropdownOption.vue'

interface Row {
  key: string
  value: string
}

const props = defineProps<{
  modelValue: Record<string, string>
  resourceType?: string
  fieldErrors?: Record<string, string>
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
  })
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

function annotationError(row: Row): string | undefined {
  const errors = props.fieldErrors
  if (!errors) return undefined
  const key = row.key.trim()
  if (!key) return undefined
  return errors[`annotations.${key}`] ?? errors[`spec.annotations.${key}`]
}

onBeforeUnmount(() => closeMenu())
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(row, index) in rows"
      :key="index"
      class="flex flex-col gap-1"
    >
      <div class="flex items-start gap-2">
        <div class="relative min-w-0 flex-1">
          <div class="relative">
            <input
              :ref="(el) => (keyInputEls[index] = el as HTMLInputElement | null)"
              v-model="row.key"
              class="h-8 w-full rounded border bg-bg-0 py-0 pl-2 pr-8 font-mono text-data text-text-1 placeholder:text-text-4 focus:outline-none"
              :class="
                annotationError(row) ? 'border-error/50' : 'border-border-1 focus:border-border-2'
              "
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
            <IconChevronDown
              :size="14"
              :stroke-width="1.75"
              class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-4 transition-transform"
              :class="openIndex === index ? 'rotate-180' : ''"
            />
          </div>

          <EditorDropdownPanel
            :open="openIndex === index"
            :open-up="openUp"
            size="wide"
            :show-empty="openSuggestions.length === 0"
            empty-text="No matching annotation keys"
          >
            <li
              class="mx-1 mb-0.5 border-b border-border-1 px-2 pb-1.5 pt-1 text-micro font-semibold uppercase tracking-widest text-text-4"
              role="presentation"
            >
              Suggested keys
            </li>
            <EditorDropdownOption
              v-for="(def, si) in openSuggestions"
              :key="def.key"
              :active="si === highlight"
              @select="pickSuggestion(index, def)"
              @hover="highlight = si"
            >
              <div class="truncate font-mono text-meta">
                {{ def.key }}
              </div>
              <div class="truncate text-micro opacity-70">
                {{ def.label }}
                <span class="text-text-4">· {{ def.purpose }}</span>
              </div>
            </EditorDropdownOption>
          </EditorDropdownPanel>
        </div>

        <input
          v-model="row.value"
          class="h-8 min-w-0 flex-[1.4] rounded border bg-bg-0 px-2 font-mono text-data text-text-1 placeholder:text-text-4 focus:outline-none"
          :class="
            annotationError(row) ? 'border-error/50' : 'border-border-1 focus:border-border-2'
          "
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
      <p
        v-if="annotationError(row)"
        class="text-meta text-error"
      >
        {{ annotationError(row) }}
      </p>
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
