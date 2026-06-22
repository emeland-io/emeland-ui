<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { IconX } from '@tabler/icons-vue'

defineProps<{
  open: boolean
  title: string
  count?: number
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="absolute inset-0 z-40 bg-black/40"
      @click="emit('close')"
    />
  </Transition>

  <Transition name="slide">
    <aside
      v-if="open"
      class="absolute right-0 top-0 z-50 flex h-full w-[55%] min-w-[480px] max-w-[1100px] flex-col border-l border-border-1 bg-bg-0 shadow-2xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border-1 px-5 py-3">
        <div class="flex items-center gap-2">
          <slot name="icon" />
          <h2 class="text-base font-medium text-text-1">{{ title }}</h2>
          <span
            v-if="count !== undefined"
            class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-[10px] text-text-3"
          >
            {{ count }}
          </span>
        </div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded text-text-4 transition-colors hover:bg-bg-2 hover:text-text-2"
          aria-label="Close"
          @click="emit('close')"
        >
          <IconX
            :size="16"
            :stroke-width="1.5"
          />
        </button>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <slot />
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
