<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'

export interface FilterChipItem {
  id: string
  name: string
}

const props = withDefaults(
  defineProps<{
    label: string
    /** plain strings act as their own id and display name */
    items: readonly (FilterChipItem | string)[]
    active: Set<string>
    /** active-chip color; findings use the warning tone */
    tone?: 'accent' | 'warning'
    /** chips beyond this count collapse into a "+n" dropdown */
    visibleLimit?: number
  }>(),
  { tone: 'accent', visibleLimit: Infinity },
)

const emit = defineEmits<{
  toggle: [id: string]
}>()

const normalized = computed<FilterChipItem[]>(() =>
  props.items.map((i) => (typeof i === 'string' ? { id: i, name: i } : i)),
)

const visible = computed(() => normalized.value.slice(0, props.visibleLimit))
const overflow = computed(() =>
  props.visibleLimit === Infinity ? [] : normalized.value.slice(props.visibleLimit),
)
const hasActiveOverflow = computed(() => overflow.value.some((i) => props.active.has(i.id)))

const activeClass = computed(() =>
  props.tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent-text',
)
const dotClass = computed(() => (props.tone === 'warning' ? 'bg-warning' : 'bg-accent'))

// only one overflow menu is open at a time, across all chip groups
const id = Symbol()
const menuOpen = computed(() => openMenuOwner.value === id)

function toggleMenu() {
  openMenuOwner.value = menuOpen.value ? null : id
}

function closeMenu() {
  if (openMenuOwner.value === id) openMenuOwner.value = null
}

onMounted(() => window.addEventListener('click', closeMenu))
onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
  closeMenu()
})
</script>

<script lang="ts">
import { ref as vueRef } from 'vue'
// module-level so opening one group's menu closes any other
const openMenuOwner = vueRef<symbol | null>(null)
</script>

<template>
  <div
    v-if="normalized.length > 0"
    class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1"
  >
    <span
      class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
    >
      {{ label }}
    </span>
    <button
      v-for="item in visible"
      :key="item.id"
      class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
      :class="
        active.has(item.id) ? activeClass : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
      "
      @click="emit('toggle', item.id)"
    >
      {{ item.name }}
    </button>

    <div
      v-if="overflow.length > 0"
      class="relative"
    >
      <button
        class="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          hasActiveOverflow ? activeClass : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        @click.stop="toggleMenu"
      >
        <span
          v-if="hasActiveOverflow"
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="dotClass"
        />
        +{{ overflow.length }}
        <IconChevronDown
          :size="10"
          :stroke-width="2"
        />
      </button>
      <div
        v-if="menuOpen"
        class="absolute left-0 top-full z-50 mt-1 min-w-max rounded border border-border-1 bg-bg-1 py-1 shadow-lg"
        @click.stop
      >
        <button
          v-for="item in overflow"
          :key="item.id"
          class="flex w-full items-center gap-2 px-3 py-1.5 font-mono text-meta transition-colors"
          :class="active.has(item.id) ? activeClass : 'text-text-3 hover:bg-bg-2'"
          @click="emit('toggle', item.id)"
        >
          <span
            class="h-1.5 w-1.5 shrink-0 rounded-full"
            :class="active.has(item.id) ? dotClass : ''"
          />
          {{ item.name }}
        </button>
      </div>
    </div>
  </div>
</template>
