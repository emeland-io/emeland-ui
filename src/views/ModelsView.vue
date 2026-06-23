<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  IconSearch,
  IconCircleOff,
  IconLoader2,
  IconCheck,
  IconCircleFilled,
} from '@tabler/icons-vue'
import { useModelsStore } from '@/stores/models'
import ListDetail from '@/components/ListDetail.vue'
import CopyButton from '@/components/CopyButton.vue'

const store = useModelsStore()

const STATUS_STYLES: Record<string, string> = {
  online: 'bg-node-sensor/10 text-node-sensor',
  offline: 'bg-error/10 text-error',
  unknown: 'bg-bg-2 text-text-3',
}
function statusStyle(status?: string): string {
  return STATUS_STYLES[status ?? 'unknown'] ?? STATUS_STYLES.unknown
}

// Search
const search = ref('')
const filteredModels = computed(() =>
  store.models.filter((m) => {
    const q = search.value.toLowerCase()
    if (!q) return true
    return (
      m.displayName.toLowerCase().includes(q) ||
      (m.environment ?? '').toLowerCase().includes(q) ||
      m.baseUrl.toLowerCase().includes(q)
    )
  }),
)

// Selection
const selectedId = ref('')
const selectedModel = computed(() => store.models.find((m) => m.modelId === selectedId.value))

watch(
  filteredModels,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
    } else if (!list.some((m) => m.modelId === selectedId.value)) {
      selectedId.value = list[0].modelId
    }
  },
  { immediate: true },
)

onMounted(() => store.load())
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <h1 class="text-base font-medium text-text-1">Models</h1>
      <span class="rounded-full bg-bg-2 px-2.5 py-0.5 font-mono text-xs text-text-3">
        {{ filteredModels.length }}
        <span
          v-if="filteredModels.length !== store.models.length"
          class="text-text-4"
        >
          of {{ store.models.length }}
        </span>
      </span>
    </div>

    <!-- Loading -->
    <div
      v-if="store.loading"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex items-center gap-2 text-text-3">
        <IconLoader2
          :size="16"
          :stroke-width="1.5"
          class="animate-spin"
        />
        <span class="text-sm">Loading models...</span>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error"
      class="flex flex-1 items-center justify-center"
    >
      <p class="text-sm text-error">{{ store.error }}</p>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-border-1 px-4 py-2">
        <div
          class="flex items-center gap-2 rounded border border-border-1 bg-bg-1 px-2.5 py-1.5"
          style="min-width: 300px"
        >
          <IconSearch
            :size="13"
            :stroke-width="1.5"
            class="shrink-0 text-text-4"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Search models, environment, URL..."
            class="w-full bg-transparent font-mono text-xs text-text-2 placeholder:text-text-4 outline-none"
          />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-if="filteredModels.length === 0"
        class="flex flex-1 items-center justify-center"
      >
        <div class="text-center">
          <IconCircleOff
            :size="32"
            :stroke-width="1.5"
            class="mx-auto text-text-4"
          />
          <p class="mt-3 text-sm text-text-2">No models</p>
          <p class="mt-1 text-xs text-text-4">No model instances configured</p>
        </div>
      </div>

      <!-- List-Detail -->
      <ListDetail v-else>
        <!-- List -->
        <template #list>
          <div
            v-for="model in filteredModels"
            :key="model.modelId"
            class="cursor-pointer border-b border-border-1 border-l-2 px-4 py-3 transition-colors"
            :class="[
              model.modelId === selectedId
                ? 'border-l-accent bg-accent/5'
                : model.modelId === store.activeId
                  ? 'border-l-transparent bg-accent/[0.03] hover:bg-accent/5'
                  : 'border-l-transparent hover:bg-bg-1',
            ]"
            @click="selectedId = model.modelId"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-text-1">{{ model.displayName }}</span>
              <span
                v-if="model.modelId === store.activeId"
                class="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-accent-text"
              >
                Active
              </span>
            </div>
            <div class="mt-2 flex items-center gap-1.5">
              <span
                class="rounded px-1.5 py-0.5 font-mono text-[11px]"
                :class="statusStyle(model.status)"
              >
                {{ model.status ?? 'unknown' }}
              </span>
              <span
                v-if="model.version"
                class="font-mono text-[11px] text-text-4"
              >
                {{ model.version }}
              </span>
            </div>
          </div>
        </template>

        <!-- Detail -->
        <template #detail>
          <div
            v-if="selectedModel"
            class="flex-1 overflow-y-auto"
          >
            <div class="border-b border-border-1 px-6 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <h2 class="text-base font-medium text-text-1">{{ selectedModel.displayName }}</h2>
                  <span
                    class="rounded px-2 py-0.5 font-mono text-xs"
                    :class="statusStyle(selectedModel.status)"
                  >
                    {{ selectedModel.status ?? 'unknown' }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="font-mono text-xs text-text-4">{{ selectedModel.modelId }}</span>
                  <CopyButton
                    :value="selectedModel.modelId"
                    :size="13"
                  />
                </div>
              </div>

              <!-- Active toggle -->
              <div class="mt-3">
                <button
                  v-if="selectedModel.modelId !== store.activeId"
                  class="flex items-center gap-1.5 rounded border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:bg-accent/20"
                  @click="store.setActive(selectedModel.modelId)"
                >
                  <IconCircleFilled
                    :size="9"
                    :stroke-width="2"
                  />
                  Set as active model
                </button>
                <span
                  v-else
                  class="flex items-center gap-1.5 text-xs text-accent-text"
                >
                  <IconCheck
                    :size="14"
                    :stroke-width="2"
                  />
                  This is the active model
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-5 px-6 py-5">
              <!-- Description -->
              <div
                v-if="selectedModel.description"
                class="rounded border border-border-1 bg-bg-1 px-4 py-3 font-mono text-sm leading-relaxed text-text-2"
              >
                {{ selectedModel.description }}
              </div>

              <!-- Connection -->
              <div>
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                  Connection
                </div>
                <div
                  class="grid gap-4 border-b border-border-1 py-1.5 text-sm"
                  style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
                >
                  <span class="font-mono text-text-3">Server URL</span>
                  <span class="break-all font-mono text-text-2">{{ selectedModel.baseUrl }}</span>
                </div>
                <div
                  v-if="selectedModel.environment"
                  class="grid gap-4 border-b border-border-1 py-1.5 text-sm"
                  style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
                >
                  <span class="font-mono text-text-3">Environment</span>
                  <span class="font-mono text-text-2">{{ selectedModel.environment }}</span>
                </div>
                <div
                  v-if="selectedModel.version"
                  class="grid gap-4 border-b border-border-1 py-1.5 text-sm"
                  style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
                >
                  <span class="font-mono text-text-3">Version</span>
                  <span class="font-mono text-text-2">{{ selectedModel.version }}</span>
                </div>
              </div>

              <!-- Annotations -->
              <div
                v-if="
                  selectedModel.annotations && Object.keys(selectedModel.annotations).length > 0
                "
              >
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-4">
                  Annotations
                </div>
                <div
                  v-for="(value, key) in selectedModel.annotations"
                  :key="key"
                  class="grid gap-4 border-b border-border-1 py-1.5 last:border-b-0 text-sm"
                  style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
                >
                  <span
                    class="truncate font-mono text-text-3"
                    :title="key"
                  >
                    {{ key }}
                  </span>
                  <span class="break-all font-mono text-text-2">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex flex-1 items-center justify-center"
          >
            <span class="font-mono text-xs text-text-4">Select a model to inspect</span>
          </div>
        </template>
      </ListDetail>
    </template>
  </div>
</template>
