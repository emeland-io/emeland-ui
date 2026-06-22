<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { IconStack2, IconSelector, IconCheck } from '@tabler/icons-vue'
import { useModelsStore } from '@/stores/models'

const store = useModelsStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}
function choose(modelId: string) {
  store.setActive(modelId)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})

const STATUS_DOT: Record<string, string> = {
  online: 'bg-node-sensor',
  offline: 'bg-text-4',
  unknown: 'bg-text-4',
}
</script>

<template>
  <div
    ref="root"
    class="relative mx-2.5 my-2"
  >
    <!-- Selector -->
    <button
      class="flex w-full items-center gap-2 rounded-md border border-border-1 bg-bg-0 px-2.5 py-2 transition-colors hover:bg-bg-2"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <IconStack2
        :size="15"
        :stroke-width="1.5"
        class="shrink-0 text-accent-text"
      />
      <span class="min-w-0 flex-1 text-left">
        <span class="block text-[9px] uppercase tracking-wider text-text-4">Model</span>
        <span class="block truncate text-xs font-medium text-text-1">
          {{ store.activeModel?.displayName ?? 'Select model' }}
        </span>
      </span>
      <IconSelector
        :size="14"
        :stroke-width="1.5"
        class="shrink-0 text-text-3"
      />
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border-1 bg-bg-1 shadow-lg"
      >
        <button
          v-for="m in store.models"
          :key="m.modelId"
          class="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-bg-2"
          @click="choose(m.modelId)"
        >
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :class="STATUS_DOT[m.status ?? 'unknown']"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-medium text-text-1">{{ m.displayName }}</span>
            <span
              v-if="m.version"
              class="block truncate font-mono text-[10px] text-text-4"
            >
              {{ m.version }}
            </span>
          </span>
          <IconCheck
            v-if="m.modelId === store.activeId"
            :size="13"
            :stroke-width="2"
            class="shrink-0 text-accent-text"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
