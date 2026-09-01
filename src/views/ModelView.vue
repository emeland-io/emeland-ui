<script setup lang="ts">
import { onMounted } from 'vue'
import { useModelStore } from '@/stores/model'
import CopyButton from '@/components/CopyButton.vue'
import SkeletonBlock from '@/components/view/SkeletonBlock.vue'
import SkeletonShell from '@/components/view/SkeletonShell.vue'
import ErrorState from '@/components/view/ErrorState.vue'

const store = useModelStore()

const STATUS_STYLES: Record<string, string> = {
  online: 'bg-accent/10 text-accent-text',
  offline: 'bg-error/10 text-error',
  unknown: 'bg-bg-2 text-text-3',
}
function statusStyle(status?: string): string {
  return STATUS_STYLES[status ?? 'unknown'] ?? STATUS_STYLES.unknown
}

onMounted(() => store.load())
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-border-1 px-5 py-3">
      <h1 class="text-title font-medium text-text-1">Model</h1>
    </div>

    <SkeletonShell
      v-if="store.loading"
      label="Loading model..."
    >
      <div class="mx-auto max-w-3xl px-6 py-6">
        <SkeletonBlock class="h-7 w-1/3" />
        <SkeletonBlock class="mt-3 h-4 w-2/3" />
        <SkeletonBlock class="mt-10 h-4 w-full" />
        <SkeletonBlock class="mt-2 h-4 w-5/6" />
        <SkeletonBlock class="mt-2 h-4 w-3/4" />
      </div>
    </SkeletonShell>

    <ErrorState
      v-else-if="store.error"
      :message="store.error"
      retry-label="Retry"
      @retry="store.load()"
    />

    <!-- Detail -->
    <div
      v-else-if="store.model"
      class="flex-1 overflow-y-auto"
    >
      <div class="mx-auto max-w-3xl px-6 py-6">
        <!-- Title block -->
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5">
              <h2 class="text-display font-medium text-text-1">{{ store.model.displayName }}</h2>
              <span
                v-if="store.model.status"
                class="rounded px-2 py-0.5 font-mono text-label"
                :class="statusStyle(store.model.status)"
              >
                {{ store.model.status }}
              </span>
            </div>
            <p
              v-if="store.model.description"
              class="mt-1 text-body text-text-3"
            >
              {{ store.model.description }}
            </p>
          </div>
        </div>

        <!-- Hosting -->
        <div class="mt-8">
          <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
            Hosting
          </div>
          <dl class="space-y-0">
            <div
              v-if="store.model.host"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Host</dt>
              <dd class="break-all font-mono text-text-2">{{ store.model.host }}</dd>
            </div>
            <div
              v-if="store.model.region"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Region</dt>
              <dd class="font-mono text-text-2">{{ store.model.region }}</dd>
            </div>
            <div
              v-if="store.model.environment"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Environment</dt>
              <dd class="font-mono text-text-2">{{ store.model.environment }}</dd>
            </div>
          </dl>
        </div>

        <!-- Connection -->
        <div class="mt-8">
          <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
            Connection
          </div>
          <dl class="space-y-0">
            <div
              v-if="store.model.baseUrl"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Server URL</dt>
              <dd class="flex items-center gap-1.5 break-all font-mono text-text-2">
                {{ store.model.baseUrl }}
                <CopyButton
                  :value="store.model.baseUrl"
                  :size="12"
                />
              </dd>
            </div>
            <div
              v-if="store.model.version"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Version</dt>
              <dd class="font-mono text-text-2">{{ store.model.version }}</dd>
            </div>
            <div
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(140px, 25%) minmax(0, 1fr)"
            >
              <dt class="font-mono text-text-3">Model ID</dt>
              <dd class="flex items-center gap-1.5 break-all font-mono text-text-2">
                {{ store.model.modelId }}
                <CopyButton
                  :value="store.model.modelId"
                  :size="12"
                />
              </dd>
            </div>
          </dl>
        </div>

        <!-- Annotations -->
        <div
          v-if="store.model.annotations && Object.keys(store.model.annotations).length > 0"
          class="mt-8"
        >
          <div class="mb-3 text-meta font-semibold uppercase tracking-widest text-text-4">
            Annotations
          </div>
          <dl class="space-y-0">
            <div
              v-for="(value, key) in store.model.annotations"
              :key="key"
              class="grid gap-4 border-b border-border-1 py-2 text-data"
              style="grid-template-columns: minmax(200px, 35%) minmax(0, 1fr)"
            >
              <dt
                class="truncate font-mono text-text-3"
                :title="key"
              >
                {{ key }}
              </dt>
              <dd class="break-all font-mono text-text-2">{{ value }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
