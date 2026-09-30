<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { RESOURCE_TYPE_BY_NAME } from '@/editor/kinds'

export interface BundleRefOption {
  id: string
  resourceType: string
  label: string
}

const props = defineProps<{
  modelValue: string
  refType: string
  options: BundleRefOption[]
  invalid?: boolean
  inputId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const openUp = ref(false)
const highlight = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

const MENU_MAX_HEIGHT = 224
const MENU_GAP = 4

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  const list = props.options.filter((o) => o.resourceType === props.refType)
  if (!q) return list
  return list.filter(
    (o) =>
      o.id.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.resourceType.toLowerCase().includes(q),
  )
})

function setOpen(next: boolean) {
  if (!next) {
    open.value = false
    highlight.value = 0
    return
  }
  const el = inputEl.value
  if (el) {
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    openUp.value = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow
  } else {
    openUp.value = false
  }
  open.value = true
  highlight.value = 0
}

function pick(opt: BundleRefOption) {
  emit('update:modelValue', opt.id)
  setOpen(false)
  void nextTick(() => inputEl.value?.blur())
}

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  setOpen(true)
}

function onFocus() {
  if (props.options.some((o) => o.resourceType === props.refType)) setOpen(true)
}

function onBlur() {
  window.setTimeout(() => setOpen(false), 120)
}

function onKeyDown(e: KeyboardEvent) {
  const list = filtered.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setOpen(true)
    highlight.value = Math.min(highlight.value + 1, Math.max(list.length - 1, 0))
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlight.value = Math.max(highlight.value - 1, 0)
    return
  }
  if (e.key === 'Enter' && open.value && list[highlight.value]) {
    e.preventDefault()
    pick(list[highlight.value]!)
    return
  }
  if (e.key === 'Escape') setOpen(false)
}

onBeforeUnmount(() => setOpen(false))

const resourceTypeLabel = computed(() => RESOURCE_TYPE_BY_NAME[props.refType]?.label ?? props.refType)
</script>

<template>
  <div class="relative w-full">
    <input
      :id="inputId"
      ref="inputEl"
      class="h-8 w-full rounded border bg-bg-0 px-2 font-mono text-data text-text-1 placeholder:text-text-4 focus:outline-none"
      :class="invalid ? 'border-error/50' : 'border-border-1 focus:border-border-2'"
      :value="modelValue"
      :placeholder="`UUID or pick ${resourceTypeLabel} from bundle`"
      spellcheck="false"
      autocomplete="off"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown"
    />

    <ul
      v-if="open && filtered.length"
      class="absolute left-0 z-20 max-h-56 w-full overflow-y-auto rounded border border-border-1 bg-bg-1 py-1 shadow-lg"
      :class="openUp ? 'bottom-full mb-1' : 'top-full mt-1'"
      role="listbox"
    >
      <li
        v-for="(opt, si) in filtered"
        :key="opt.id"
        role="option"
        class="cursor-pointer px-2.5 py-1.5"
        :class="si === highlight ? 'bg-bg-2' : 'hover:bg-bg-2'"
        :aria-selected="si === highlight"
        @mousedown.prevent="pick(opt)"
        @mouseenter="highlight = si"
      >
        <div class="truncate text-meta font-medium text-text-1">
          {{ opt.label }}
        </div>
        <div class="truncate font-mono text-micro text-text-3">
          {{ opt.id }}
        </div>
      </li>
    </ul>
  </div>
</template>
