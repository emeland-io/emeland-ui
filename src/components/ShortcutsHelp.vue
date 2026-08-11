<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { IconX } from '@tabler/icons-vue'
import { SHORTCUT_GROUPS, HELP_KEY } from '@/constants/shortcuts'
import { isEditableTarget } from '@/utils/dom'
import { useShortcutsHelp } from '@/composables/useShortcutsHelp'
import { useWindowKeydown } from '@/composables/useWindowKeydown'

const { open, close } = useShortcutsHelp()

const closeEl = ref<HTMLElement | null>(null)

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  closeEl.value?.focus({ preventScroll: true })
})

function onKeydown(e: KeyboardEvent) {
  if (open.value && e.key === 'Escape') {
    e.stopImmediatePropagation()
    close()
    return
  }
  if (open.value && e.key === 'Tab') {
    e.preventDefault()
    e.stopImmediatePropagation()
    closeEl.value?.focus({ preventScroll: true })
    return
  }
  if (e.key === HELP_KEY && !isEditableTarget(e.target)) {
    e.preventDefault()
    open.value = !open.value
  }
}

useWindowKeydown(onKeydown)
</script>

<template>
  <Teleport to="body">
    <Transition name="help-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        @click.self="close"
      >
        <div
          class="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg border border-border-1 bg-bg-0 shadow-2xl"
        >
          <div class="flex items-center justify-between border-b border-border-1 px-5 py-3">
            <h2 class="text-title font-medium text-text-1">Keyboard shortcuts</h2>
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

          <div class="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
            <section
              v-for="group in SHORTCUT_GROUPS"
              :key="group.title"
            >
              <h3 class="text-meta font-medium uppercase tracking-wide text-text-3">
                {{ group.title }}
              </h3>
              <p
                v-if="group.hint"
                class="mt-0.5 text-micro text-text-4"
              >
                {{ group.hint }}
              </p>
              <ul class="mt-2 space-y-1.5">
                <li
                  v-for="(sc, i) in group.shortcuts"
                  :key="i"
                  class="flex items-center justify-between gap-4"
                >
                  <span class="text-meta text-text-2">{{ sc.label }}</span>
                  <span class="flex shrink-0 items-center gap-1">
                    <kbd
                      v-for="(k, ki) in sc.keys"
                      :key="ki"
                      class="inline-flex min-w-5 items-center justify-center rounded border border-border-1 bg-bg-1 px-1.5 py-0.5 font-mono text-micro text-text-2"
                    >
                      {{ k }}
                    </kbd>
                  </span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.help-fade-enter-active,
.help-fade-leave-active {
  transition: opacity 0.15s ease;
}

.help-fade-enter-from,
.help-fade-leave-to {
  opacity: 0;
}
</style>
