<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { IconX, IconChevronUp, IconChevronDown } from '@tabler/icons-vue'
import { isEditableTarget } from '@/utils/dom'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useModalSurfaces } from '@/composables/useModalSurfaces'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    count?: number
    size?: 'default' | 'wide'
    navIndex?: number
    navCount?: number
  }>(),
  {
    subtitle: undefined,
    count: undefined,
    size: 'default',
    navIndex: undefined,
    navCount: undefined,
  },
)

const emit = defineEmits<{
  close: []
  'nav-prev': []
  'nav-next': []
}>()

const panel = ref<HTMLElement | null>(null)

const FOCUSABLE = '[data-drawer-relation]'

function focusRoot() {
  panel.value?.focus({ preventScroll: true })
}

const { drawerOpenCount, paletteOpen, helpOpen } = useModalSurfaces()
let trackedOpen = false

watch(
  () => props.open,
  async (open) => {
    if (open !== trackedOpen) {
      trackedOpen = open
      drawerOpenCount.value += open ? 1 : -1
    }
    if (!open) return
    await nextTick()
    focusRoot()
  },
  { immediate: true },
)

onUnmounted(() => {
  if (trackedOpen) drawerOpenCount.value--
})

function onKeydown(e: KeyboardEvent) {
  if (paletteOpen.value || helpOpen.value) return
  if (!props.open) return
  if (e.key === 'Escape') {
    e.stopImmediatePropagation()
    const el = document.activeElement as HTMLElement | null
    if (el && panel.value && el !== panel.value && panel.value.contains(el)) {
      focusRoot() // content -> root
      return
    }

    emit('close')
    return
  }
  // Tab / Shift+Tab cycles
  if (e.key === 'Tab') {
    const root = panel.value
    if (!root) return
    e.preventDefault()
    e.stopImmediatePropagation()
    const order = [root, ...focusablesInside()]
    const active = document.activeElement as HTMLElement | null
    const i = order.indexOf(active as HTMLElement)
    const from = i < 0 ? 0 : i
    const next = (from + (e.shiftKey ? -1 : 1) + order.length) % order.length
    order[next]?.focus()
    return
  }
  // step through the collection
  if (isEditableTarget(e.target) || (props.navCount ?? 0) < 1) return
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopImmediatePropagation()
    emit('nav-prev')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopImmediatePropagation()
    emit('nav-next')
  }
}

function focusablesInside(): HTMLElement[] {
  return [...(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
}

useWindowKeydown(onKeydown)
</script>

<template>
  <Transition name="slide">
    <aside
      v-if="open"
      ref="panel"
      tabindex="-1"
      class="absolute right-0 top-0 z-50 flex h-full flex-col border-l-2 border-l-text-3 bg-bg-0 outline-none"
      :class="
        size === 'wide'
          ? 'w-[75%] min-w-[640px] max-w-[1500px]'
          : 'w-[55%] min-w-[480px] max-w-[1100px]'
      "
    >
      <!-- Header -->
      <div
        class="flex cursor-pointer select-none items-center justify-between border-b border-border-1 px-5 py-3"
        title="Double-click to close"
        @dblclick="emit('close')"
      >
        <div class="min-w-0">
          <div class="flex min-w-0 items-baseline gap-2">
            <h2 class="truncate text-title font-medium text-text-1">{{ title }}</h2>
            <span
              v-if="count !== undefined"
              class="shrink-0 rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3"
            >
              {{ count }}
            </span>
          </div>
          <div
            v-if="subtitle || $slots['header-tags']"
            class="mt-1.5 flex items-center gap-1.5"
          >
            <span
              v-if="subtitle"
              class="inline-block rounded bg-bg-2 px-2 py-0.5 font-mono text-meta text-text-3"
            >
              {{ subtitle }}
            </span>
            <slot name="header-tags" />
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-0.5">
          <template v-if="navCount !== undefined && navCount > 1 && navIndex !== undefined">
            <span class="mr-1 font-mono text-micro tabular-nums text-text-4">
              {{ navIndex + 1 }} / {{ navCount }}
            </span>
            <button
              class="flex h-7 w-7 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2 focus-visible:bg-bg-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-4"
              :disabled="navIndex <= 0"
              title="Previous instance (↑)"
              @click="emit('nav-prev')"
              @dblclick.stop
            >
              <IconChevronUp
                :size="16"
                :stroke-width="1.5"
              />
            </button>
            <button
              class="flex h-7 w-7 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-4 focus-visible:bg-bg-2"
              :disabled="navIndex >= navCount - 1"
              title="Next instance (↓)"
              @click="emit('nav-next')"
              @dblclick.stop
            >
              <IconChevronDown
                :size="16"
                :stroke-width="1.5"
              />
            </button>
          </template>
          <button
            class="flex h-7 w-7 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2 focus-visible:bg-bg-2"
            aria-label="Close"
            @click="emit('close')"
            @dblclick.stop
          >
            <IconX
              :size="16"
              :stroke-width="1.5"
            />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <slot />
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
