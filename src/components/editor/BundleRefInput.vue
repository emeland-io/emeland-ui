<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'
import { RESOURCE_TYPE_BY_NAME } from '@/editor/kinds'
import EditorDropdownPanel from '@/components/editor/EditorDropdownPanel.vue'
import EditorDropdownOption from '@/components/editor/EditorDropdownOption.vue'

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

const typed = computed(() => props.options.filter((o) => o.resourceType === props.refType))

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q) return typed.value
  return typed.value.filter(
    (o) =>
      o.id.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.resourceType.toLowerCase().includes(q),
  )
})

const hasTypedOptions = computed(() => typed.value.length > 0)

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
  if (hasTypedOptions.value) setOpen(true)
}

function onFocus() {
  if (hasTypedOptions.value) setOpen(true)
}

function onBlur() {
  window.setTimeout(() => setOpen(false), 120)
}

function onKeyDown(e: KeyboardEvent) {
  const list = filtered.value
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (hasTypedOptions.value) setOpen(true)
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

const resourceTypeLabel = computed(
  () => RESOURCE_TYPE_BY_NAME[props.refType]?.label ?? props.refType,
)
</script>

<template>
  <div class="relative w-full">
    <div class="relative">
      <input
        :id="inputId"
        ref="inputEl"
        class="h-8 w-full rounded border bg-bg-0 py-0 pl-2 pr-8 font-mono text-data text-text-1 placeholder:text-text-4 focus:outline-none"
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
      <IconChevronDown
        v-if="hasTypedOptions"
        :size="14"
        :stroke-width="1.75"
        class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-4 transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </div>

    <EditorDropdownPanel
      :open="open && hasTypedOptions"
      :open-up="openUp"
      size="match"
      :show-empty="filtered.length === 0"
      empty-text="No matching bundle documents"
    >
      <li
        class="mx-1 mb-0.5 border-b border-border-1 px-2 pb-1.5 pt-1 text-micro font-semibold uppercase tracking-widest text-text-4"
        role="presentation"
      >
        From bundle
      </li>
      <EditorDropdownOption
        v-for="(opt, si) in filtered"
        :key="opt.id"
        :active="si === highlight"
        @select="pick(opt)"
        @hover="highlight = si"
      >
        <div class="truncate text-meta font-medium">
          {{ opt.label }}
        </div>
        <div class="truncate font-mono text-micro opacity-70">
          {{ opt.id }}
        </div>
      </EditorDropdownOption>
    </EditorDropdownPanel>
  </div>
</template>
