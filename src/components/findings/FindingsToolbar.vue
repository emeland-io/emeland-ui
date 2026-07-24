<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { IconSearch, IconChevronDown, IconX } from '@tabler/icons-vue'

const props = defineProps<{
  search: string
  types: string[]
  resourceTypes: string[]
  activeTypes: Set<string>
  activeResourceTypes: Set<string>
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle-type': [kind: string]
  'toggle-resource-type': [rt: string]
  clear: []
}>()

const TYPE_VISIBLE = 3
const RES_VISIBLE = 3

const visibleTypes = computed(() => props.types.slice(0, TYPE_VISIBLE))
const overflowTypes = computed(() => props.types.slice(TYPE_VISIBLE))
const hasActiveOverflowType = computed(() =>
  overflowTypes.value.some((k) => props.activeTypes.has(k)),
)

const visibleResTypes = computed(() => props.resourceTypes.slice(0, RES_VISIBLE))
const overflowResTypes = computed(() => props.resourceTypes.slice(RES_VISIBLE))
const hasActiveOverflowRes = computed(() =>
  overflowResTypes.value.some((r) => props.activeResourceTypes.has(r)),
)

const hasActiveFilters = computed(
  () => !!props.search || props.activeTypes.size > 0 || props.activeResourceTypes.size > 0,
)

const showTypeOverflow = ref(false)
const showResOverflow = ref(false)

function toggleTypeOverflow() {
  showTypeOverflow.value = !showTypeOverflow.value
  showResOverflow.value = false
}
function toggleResOverflow() {
  showResOverflow.value = !showResOverflow.value
  showTypeOverflow.value = false
}
function closeOverflows() {
  showTypeOverflow.value = false
  showResOverflow.value = false
}

onMounted(() => window.addEventListener('click', closeOverflows))
onUnmounted(() => window.removeEventListener('click', closeOverflows))
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
    <!-- Search -->
    <div
      class="flex items-center gap-2 rounded bg-bg-2 px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
      style="min-width: 300px"
    >
      <IconSearch
        :size="13"
        :stroke-width="1.5"
        class="shrink-0 text-text-4"
      />
      <input
        :value="search"
        type="text"
        placeholder="Search summary, description, annotations..."
        class="w-full bg-transparent font-mono text-label text-text-2 placeholder:text-meta placeholder:text-text-4 outline-none"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Type filters -->
    <div class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1">
      <span
        class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
      >
        Type
      </span>
      <button
        v-for="kind in visibleTypes"
        :key="kind"
        class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          activeTypes.has(kind)
            ? 'bg-warning/10 text-warning'
            : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        @click="emit('toggle-type', kind)"
      >
        {{ kind }}
      </button>

      <div
        v-if="overflowTypes.length > 0"
        class="relative"
      >
        <button
          class="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-meta transition-colors"
          :class="
            hasActiveOverflowType
              ? 'bg-warning/10 text-warning'
              : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
          "
          @click.stop="toggleTypeOverflow"
        >
          <span
            v-if="hasActiveOverflowType"
            class="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
          />
          +{{ overflowTypes.length }}
          <IconChevronDown
            :size="10"
            :stroke-width="2"
          />
        </button>
        <div
          v-if="showTypeOverflow"
          class="absolute left-0 top-full z-50 mt-1 min-w-max rounded border border-border-1 bg-bg-1 py-1 shadow-lg"
          @click.stop
        >
          <button
            v-for="kind in overflowTypes"
            :key="kind"
            class="flex w-full items-center gap-2 px-3 py-1.5 font-mono text-meta transition-colors"
            :class="
              activeTypes.has(kind) ? 'bg-warning/10 text-warning' : 'text-text-3 hover:bg-bg-2'
            "
            @click="emit('toggle-type', kind)"
          >
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="activeTypes.has(kind) ? 'bg-warning' : ''"
            />
            {{ kind }}
          </button>
        </div>
      </div>
    </div>

    <!-- Resource filters -->
    <div class="flex items-center gap-1.5 rounded bg-bg-2 px-2 py-1">
      <span
        class="shrink-0 cursor-default select-none text-micro font-medium uppercase tracking-wider text-text-4"
      >
        Resource
      </span>
      <button
        v-for="rt in visibleResTypes"
        :key="rt"
        class="rounded px-2 py-0.5 font-mono text-meta transition-colors"
        :class="
          activeResourceTypes.has(rt)
            ? 'bg-accent/10 text-accent-text'
            : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
        "
        @click="emit('toggle-resource-type', rt)"
      >
        {{ rt }}
      </button>

      <div
        v-if="overflowResTypes.length > 0"
        class="relative"
      >
        <button
          class="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-meta transition-colors"
          :class="
            hasActiveOverflowRes
              ? 'bg-accent/10 text-accent-text'
              : 'bg-bg-0 text-text-3 hover:bg-bg-1 hover:text-text-1'
          "
          @click.stop="toggleResOverflow"
        >
          <span
            v-if="hasActiveOverflowRes"
            class="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
          />
          +{{ overflowResTypes.length }}
          <IconChevronDown
            :size="10"
            :stroke-width="2"
          />
        </button>
        <div
          v-if="showResOverflow"
          class="absolute left-0 top-full z-50 mt-1 min-w-max rounded border border-border-1 bg-bg-1 py-1 shadow-lg"
          @click.stop
        >
          <button
            v-for="rt in overflowResTypes"
            :key="rt"
            class="flex w-full items-center gap-2 px-3 py-1.5 font-mono text-meta transition-colors"
            :class="
              activeResourceTypes.has(rt)
                ? 'bg-accent/10 text-accent-text'
                : 'text-text-3 hover:bg-bg-2'
            "
            @click="emit('toggle-resource-type', rt)"
          >
            <span
              class="h-1.5 w-1.5 shrink-0 rounded-full"
              :class="activeResourceTypes.has(rt) ? 'bg-accent' : ''"
            />
            {{ rt }}
          </button>
        </div>
      </div>
    </div>

    <!-- Clear -->
    <button
      v-if="hasActiveFilters"
      class="ml-auto flex items-center gap-1 text-meta text-text-4 hover:text-text-2"
      @click="emit('clear')"
    >
      <IconX
        :size="11"
        :stroke-width="1.5"
      />
      Clear
    </button>
  </div>
</template>
