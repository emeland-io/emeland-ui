<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowUpRight, IconArrowsExchange } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import CopyButton from '@/components/CopyButton.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationsTable from '@/components/AnnotationsTable.vue'
import { endpointUrl } from '@/utils/endpoint'
import { differingAnnotationKeys } from '@/utils/annotations'
import type { Api, ApiInstance } from '@/types/api'
import type { ApiContextFlow } from '@/utils/apiContexts'

const props = defineProps<{
  api: Api | undefined
  flow?: ApiContextFlow
}>()

const emit = defineEmits<{
  'open-instance': [id: string]
}>()

const store = useApiStore()
const systemStore = useSystemStore()
const componentStore = useComponentStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { goToResource, goToFinding } = useResourceNav()

const systemName = computed(() =>
  props.api ? systemStore.systemMap.get(props.api.system)?.displayName : undefined,
)
const systemUnresolved = computed(
  () => !!props.api?.system && !systemStore.systemMap.has(props.api.system),
)

// Per the model, exactly one component provides an API (abstract systems are the
// exception: they document APIs without exposing their internal makeup), while
// any number of components may consume it.
const providers = computed(() => {
  const id = props.api?.apiId
  if (!id) return []
  return componentStore.components.filter((c) => c.provides.includes(id))
})

const consumers = computed(() => {
  const id = props.api?.apiId
  if (!id) return []
  return componentStore.components.filter((c) => c.consumes.includes(id))
})

const relatedFindings = computed(() => {
  const id = props.api?.apiId
  if (!id) return []
  return findingsStore.findings.filter((f) => f.resources.some((r) => r.resourceId === id))
})

function contextName(id: string): string {
  return contextStore.contextMap.get(id)?.displayName ?? id
}

const hasContextFlow = computed(
  () =>
    !!props.flow &&
    (props.flow.providerContexts.length > 0 || props.flow.consumerContexts.length > 0),
)

const instances = computed(() => (props.api ? store.getInstancesForApi(props.api.apiId) : []))

function systemInstanceName(id: string | undefined): string | undefined {
  if (!id) return undefined
  return systemStore.systemInstanceMap.get(id)?.displayName
}

function contextForInstance(inst: ApiInstance): string | undefined {
  const ctxId = inst.systemInstance
    ? systemStore.systemInstanceMap.get(inst.systemInstance)?.context
    : undefined
  return ctxId ? contextStore.contextMap.get(ctxId)?.displayName : undefined
}

const instanceRows = computed(() =>
  instances.value
    .map((inst) => ({
      inst,
      url: endpointUrl(inst.annotations),
      context: contextForInstance(inst),
      systemInstance: systemInstanceName(inst.systemInstance),
    }))
    .sort(
      (a, b) =>
        (a.context ?? '').localeCompare(b.context ?? '') ||
        a.inst.displayName.localeCompare(b.inst.displayName),
    ),
)

// annotation keys that differ across the instances of this API
const differingKeys = computed(() =>
  differingAnnotationKeys(instances.value.map((i) => i.annotations)),
)

const diffNote = computed(() => {
  const n = differingKeys.value.length
  if (n === 0) return ''
  return n === 1
    ? '1 annotation key differs across instances'
    : `${n} annotation keys differ across instances`
})

function versionDates(a: Api | undefined): [string, string][] {
  if (!a?.version) return []
  const v = a.version
  const rows: [string, string][] = []
  if (v.availableFrom) rows.push(['Available from', v.availableFrom])
  if (v.deprecatedFrom) rows.push(['Deprecated from', v.deprecatedFrom])
  if (v.terminatedFrom) rows.push(['Terminated from', v.terminatedFrom])
  return rows
}
</script>

<template>
  <div
    v-if="api"
    class="@container flex-1 overflow-y-auto"
  >
    <div class="border-b border-border-1 px-6 py-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-title font-medium text-text-1">{{ api.displayName }}</h2>
          <div class="mt-2 flex items-center gap-2">
            <span
              class="rounded px-2 py-0.5 font-mono text-label"
              :class="
                api.type === 'Unknown' ? 'bg-bg-2 text-text-3' : 'bg-accent/10 text-accent-text'
              "
            >
              {{ api.type }}
            </span>
            <span
              v-if="api.version?.version"
              class="rounded bg-bg-2 px-2 py-0.5 font-mono text-label text-text-3"
            >
              v{{ api.version.version }}
            </span>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-mono text-label text-text-4">{{ api.apiId }}</span>
            <CopyButton
              :value="api.apiId"
              :size="13"
            />
          </div>
          <div
            v-for="[label, value] in versionDates(api)"
            :key="label"
            class="mt-1 flex items-baseline justify-end gap-3 font-mono text-micro text-text-4"
          >
            <span>{{ label }}</span>
            <span class="tabular-nums text-text-3">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-5 px-6 py-5">
      <!-- detail load failed -->
      <div
        v-if="store.hasDetailError(api.apiId)"
        class="flex items-start gap-2 rounded border border-error/20 bg-error/5 px-3 py-2"
      >
        <div class="min-w-0">
          <div class="text-body text-error">Could not load full details</div>
          <div class="mt-0.5 font-mono text-meta text-error/80">
            Showing basic info only — the detail request failed.
          </div>
        </div>
      </div>
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8 @3xl:[&>*:nth-child(3)]:border-l @3xl:[&>*:nth-child(3)]:border-border-1/50 @3xl:[&>*:nth-child(3)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <div>
            <!-- description -->
            <p
              v-if="api.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ api.description }}
            </p>
          </div>
          <div>
            <SectionLabel>System</SectionLabel>
            <p
              v-if="!api.system"
              class="text-data leading-snug text-text-4"
            >
              No system.
            </p>
            <button
              v-else-if="!systemUnresolved"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to system"
              @click="goToResource('System', api.system)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                >
                  System
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ systemName }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ api.system }}</span>
                <CopyButton
                  :value="api.system"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
            <div
              v-else
              class="flex flex-col gap-1 border-b border-border-1 py-2 last:border-b-0"
            >
              <div class="flex items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-error/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-error"
                >
                  System
                </span>
                <span class="min-w-0 truncate text-body text-error">Unresolved system</span>
              </div>
              <span class="font-mono text-meta text-text-4">{{ api.system }}</span>
            </div>
          </div>
          <div v-if="hasContextFlow && flow">
            <!-- Contexts: where the API is provided vs consumed -->
            <SectionLabel :count="flow.providerContexts.length + flow.consumerContexts.length">
              Contexts
            </SectionLabel>
            <div
              v-if="flow.crosses"
              class="mb-2 flex items-center gap-1.5 rounded border border-border-1 bg-bg-2 px-2 py-1 font-mono text-meta text-text-3"
            >
              <IconArrowsExchange
                :size="12"
                :stroke-width="2"
                class="shrink-0"
              />
              Crosses a context boundary
            </div>
            <div class="flex flex-col gap-3">
              <div>
                <p class="mb-1 text-micro font-medium uppercase tracking-wider text-text-4">
                  Provided in
                </p>
                <p
                  v-if="flow.providerContexts.length === 0"
                  class="text-data leading-snug text-text-4"
                >
                  No deployed provider.
                </p>
                <button
                  v-for="ctx in flow.providerContexts"
                  :key="ctx"
                  class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
                  title="Go to context"
                  @click="goToResource('Context', ctx)"
                >
                  <span class="group/row flex w-full items-center gap-3">
                    <span
                      class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                    >
                      {{ contextName(ctx) }}
                    </span>
                    <IconArrowUpRight
                      :size="15"
                      :stroke-width="2"
                      class="ml-auto shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                    />
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="font-mono text-meta text-text-4">{{ ctx }}</span>
                    <CopyButton
                      :value="ctx"
                      :size="12"
                      @click.stop
                    />
                  </span>
                </button>
              </div>
              <div>
                <p class="mb-1 text-micro font-medium uppercase tracking-wider text-text-4">
                  Consumed in
                </p>
                <p
                  v-if="flow.consumerContexts.length === 0"
                  class="text-data leading-snug text-text-4"
                >
                  No deployed consumers.
                </p>
                <button
                  v-for="ctx in flow.consumerContexts"
                  :key="ctx"
                  class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
                  title="Go to context"
                  @click="goToResource('Context', ctx)"
                >
                  <span class="group/row flex w-full items-center gap-3">
                    <span
                      class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                    >
                      {{ contextName(ctx) }}
                    </span>
                    <span
                      v-if="flow.crossContexts.includes(ctx)"
                      class="flex shrink-0 items-center gap-1 rounded-full border border-border-2 bg-bg-2 px-1.5 py-0.5 font-mono text-micro text-text-3"
                      title="Consumed here, but not provided here — traffic crosses a boundary"
                    >
                      <IconArrowsExchange
                        :size="10"
                        :stroke-width="2"
                      />
                    </span>
                    <IconArrowUpRight
                      :size="15"
                      :stroke-width="2"
                      class="ml-auto shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                    />
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="font-mono text-meta text-text-4">{{ ctx }}</span>
                    <CopyButton
                      :value="ctx"
                      :size="12"
                      @click.stop
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <!-- Provided by -->
            <SectionLabel :count="providers.length">Provided by</SectionLabel>
            <p
              v-if="providers.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No providing component.
            </p>
            <button
              v-for="c in providers"
              :key="c.componentId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to component"
              @click="goToResource('Component', c.componentId)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                >
                  Component
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ c.displayName }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ c.componentId }}</span>
                <CopyButton
                  :value="c.componentId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
          <!-- Related findings -->
          <div>
            <SectionLabel
              :count="relatedFindings.length"
              tone="warning"
            >
              Findings
            </SectionLabel>
            <p
              v-if="relatedFindings.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No findings.
            </p>
            <button
              v-for="f in relatedFindings"
              :key="f.findingId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to finding"
              @click="goToFinding(f.findingId)"
            >
              <span class="group/row flex w-full items-center gap-2.5">
                <span
                  class="shrink-0 rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-micro text-warning"
                >
                  {{ findingsStore.getKindForFinding(f) }}
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ f.displayName }}
                </span>
                <IconArrowUpRight
                  :size="15"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ f.findingId }}</span>
                <CopyButton
                  :value="f.findingId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-6 @3xl:row-span-2">
          <div>
            <!-- Consumed by -->
            <SectionLabel :count="consumers.length">Consumed by</SectionLabel>
            <p
              v-if="consumers.length === 0"
              class="text-data leading-snug text-text-4"
            >
              No consuming components.
            </p>
            <button
              v-for="c in consumers"
              :key="c.componentId"
              class="flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Go to component"
              @click="goToResource('Component', c.componentId)"
            >
              <span class="group/row flex w-full items-center gap-3">
                <span
                  class="w-28 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-center font-mono text-meta font-semibold uppercase text-accent-text"
                >
                  Component
                </span>
                <span
                  class="min-w-0 truncate text-body text-text-2 transition-colors group-hover/row:text-accent"
                >
                  {{ c.displayName }}
                </span>
                <IconArrowUpRight
                  :size="16"
                  :stroke-width="2"
                  class="shrink-0 text-text-4 transition-colors group-hover/row:text-accent"
                />
              </span>
              <span class="flex items-center gap-1.5">
                <span class="font-mono text-meta text-text-4">{{ c.componentId }}</span>
                <CopyButton
                  :value="c.componentId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
          <div>
            <!-- Annotations -->
            <SectionLabel :count="Object.keys(api.annotations).length">Annotations</SectionLabel>
            <p
              v-if="Object.keys(api.annotations).length === 0"
              class="text-data leading-snug text-text-4"
            >
              No annotations.
            </p>
            <AnnotationsTable
              v-else
              :annotations="api.annotations"
              layout="stacked"
            />
          </div>
        </div>
        <div
          v-if="instanceRows.length > 0"
          class="@3xl:col-span-2"
        >
          <!-- Instances / endpoints -->
          <div>
            <div class="flex items-baseline justify-between gap-3">
              <SectionLabel :count="instanceRows.length">Instances</SectionLabel>
              <span
                v-if="differingKeys.length > 0"
                class="shrink-0 cursor-default font-mono text-micro text-text-4"
                :title="`Differing annotation keys:\n${differingKeys.join('\n')}`"
              >
                {{ diffNote }}
              </span>
            </div>
            <button
              v-for="row in instanceRows"
              :key="row.inst.apiInstanceId"
              class="group flex w-full flex-col gap-1 border-b border-border-1 py-2 text-left last:border-b-0"
              title="Show instance details"
              @click="emit('open-instance', row.inst.apiInstanceId)"
            >
              <span class="flex w-full items-center gap-3">
                <span
                  class="min-w-0 flex-1 truncate text-body text-text-2 transition-colors group-hover:text-accent"
                >
                  {{ row.inst.displayName }}
                </span>
                <span
                  v-if="row.context"
                  class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-4"
                  :title="row.systemInstance"
                >
                  <span class="rounded-sm bg-bg-3 px-1 text-text-3">C</span>
                  {{ row.context }}
                </span>
              </span>
              <span class="flex items-center gap-1.5">
                <span
                  v-if="row.url"
                  class="min-w-0 truncate rounded bg-accent/10 px-1.5 py-0.5 font-mono text-meta text-accent-text"
                  :title="row.url"
                >
                  {{ row.url }}
                </span>
                <span
                  v-else
                  class="shrink-0 font-mono text-meta text-text-4"
                  title="No emeland.io/endpoint.host annotation — not a probe target"
                >
                  no endpoint declared
                </span>
                <CopyButton
                  v-if="row.url"
                  :value="row.url"
                  :size="12"
                  @click.stop
                />
                <span class="ml-2 font-mono text-meta text-text-4">
                  {{ row.inst.apiInstanceId }}
                </span>
                <CopyButton
                  :value="row.inst.apiInstanceId"
                  :size="12"
                  @click.stop
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="flex flex-1 items-center justify-center"
  >
    <span class="font-mono text-label text-text-4">Select an API to inspect</span>
  </div>
</template>
