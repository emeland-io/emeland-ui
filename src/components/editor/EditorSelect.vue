<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'
import EditorDropdownPanel from '@/components/editor/EditorDropdownPanel.vue'
import EditorDropdownOption from '@/components/editor/EditorDropdownOption.vue'

const props = defineProps<{
  modelValue: string
  options: readonly string[]
  invalid?: boolean
  inputId?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const openUp = ref(false)
const highlight = ref(0)
const rootEl = ref<HTMLElement | null>(null)

const MENU_MAX_HEIGHT = 224
const MENU_GAP = 4

const label = computed(() => props.modelValue || props.placeholder || 'Select…')

function setOpen(next: boolean) {
  if (!next) {
    open.value = false
    return
  }
  const el = rootEl.value
  if (el) {
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    openUp.value = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow
  } else {
    openUp.value = false
  }
  open.value = true
  highlight.value = Math.max(
    0,
    props.options.findIndex((o) => o === props.modelValue),
  )
}

function pick(value: string) {
  emit('update:modelValue', value)
  setOpen(false)
}

function onKeyDown(e: KeyboardEvent) {
  const list = props.options
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
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (!open.value) {
      setOpen(true)
      return
    }
    const v = list[highlight.value]
    if (v) pick(v)
    return
  }
  if (e.key === 'Escape') setOpen(false)
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  if (rootEl.value?.contains(e.target as Node)) return
  setOpen(false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})
</script>

<template>
  <div
    ref="rootEl"
    class="relative w-fit min-w-[11rem] max-w-[16rem]"
  >
    <button
      :id="inputId"
      type="button"
      class="flex h-8 w-full items-center justify-between gap-2 rounded border bg-bg-0 px-2 text-left text-body text-text-1 focus:outline-none"
      :class="invalid ? 'border-error/50' : 'border-border-1 focus:border-border-2'"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="setOpen(!open)"
      @keydown="onKeyDown"
    >
      <span
        class="truncate"
        :class="modelValue ? 'text-text-1' : 'text-text-4'"
      >
        {{ label }}
      </span>
      <IconChevronDown
        :size="14"
        :stroke-width="1.75"
        class="shrink-0 text-text-4 transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <EditorDropdownPanel
      :open="open"
      :open-up="openUp"
      size="content"
    >
      <EditorDropdownOption
        v-for="(opt, si) in options"
        :key="opt"
        :active="si === highlight"
        @select="pick(opt)"
        @hover="highlight = si"
      >
        <span class="flex items-center justify-between gap-2 truncate text-meta font-medium">
          {{ opt }}
          <span
            v-if="opt === modelValue"
            class="shrink-0 text-micro text-accent-text"
          >
            selected
          </span>
        </span>
      </EditorDropdownOption>
    </EditorDropdownPanel>
  </div>
</template>
