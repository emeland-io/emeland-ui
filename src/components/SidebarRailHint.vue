<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useSidebarNav } from '@/composables/useSidebarNav'
import { useSidebarWidth } from '@/composables/useSidebarWidth'
import { useSidebarHover } from '@/composables/useSidebarHover'

/** ms before a hovered row names itself */
const HOVER_DELAY = 260

const { cursorItem, items } = useSidebarNav()
const { collapsed } = useSidebarWidth()
const { hoveredRoute } = useSidebarHover()

const target = computed(() => {
  if (!collapsed.value) return null
  if (cursorItem.value) return { item: cursorItem.value, source: 'cursor' as const }
  const hovered = items.value.find((i) => i.route === hoveredRoute.value)
  return hovered ? { item: hovered, source: 'hover' as const } : null
})

type Hint = {
  label: string
  phase?: string
  source: 'cursor' | 'hover'
  top: number
  left: number
}
const hint = ref<Hint | null>(null)

let timer = 0
let frame = 0
function clearPending() {
  clearTimeout(timer)
  cancelAnimationFrame(frame)
}

watch(
  target,
  (next) => {
    clearPending()
    if (!next) {
      hint.value = null
      return
    }
    timer = window.setTimeout(
      () => {
        // measured a frame late: `focus()` may still be scrolling the row in
        frame = requestAnimationFrame(() => {
          const el = document.querySelector<HTMLElement>(
            `[data-nav-route="${CSS.escape(next.item.route)}"]`,
          )
          if (!el) {
            hint.value = null
            return
          }
          const rect = el.getBoundingClientRect()
          hint.value = {
            label: next.item.label,
            phase: next.item.phase,
            source: next.source,
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
          }
        })
      },
      next.source === 'hover' ? HOVER_DELAY : 0,
    )
  },
  { immediate: true },
)

onUnmounted(clearPending)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="hint"
      class="pointer-events-none fixed z-50 flex -translate-y-1/2 items-center gap-1.5 rounded border bg-bg-1 px-2 py-1 shadow-lg"
      :class="hint.source === 'cursor' ? 'border-match/50' : 'border-border-2'"
      :style="{ top: hint.top + 'px', left: hint.left + 'px' }"
      role="status"
      aria-live="polite"
    >
      <span class="whitespace-nowrap text-meta font-medium text-text-1">{{ hint.label }}</span>
      <span
        v-if="hint.phase"
        class="font-mono text-micro font-semibold tracking-[0.08em] text-text-4"
      >
        {{ hint.phase }}
      </span>
    </div>
  </Teleport>
</template>
