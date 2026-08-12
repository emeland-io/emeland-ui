<script setup lang="ts">
import { computed } from 'vue'
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-vue'
import type { GraphNode, GraphNodeKind, NodeInstanceRef } from '@/types/graph'
import type { ResourceType } from '@/types/common'
import TypeChip from '@/components/TypeChip.vue'

const props = withDefaults(
  defineProps<{
    node: GraphNode
    incoming: number
    outgoing: number
    instances?: NodeInstanceRef[]
    providers?: string[]
    consumers?: string[]
  }>(),
  { instances: () => [], providers: () => [], consumers: () => [] },
)

const MAX_DESCRIPTION = 200
const MAX_INSTANCES = 5
const MAX_RELATIONS = 5
const MAX_FINDING_KINDS = 5

const KIND_LABEL: Record<GraphNodeKind, string> = {
  system: 'System',
  instance: 'Instance',
  context: 'Context',
  'context-node': 'Context',
  api: 'API',
  component: 'Component',
}

// Node data is a partial union, read the optional fields loosely
const data = computed(
  () =>
    props.node.data as {
      abstract?: boolean
      type?: string
      system?: string
      context?: string
      component?: string
      systemInstance?: string
      version?: string
      findings?: number
      findingKinds?: string[]
      instances?: number
      crosses?: boolean
      description?: string
      unmapped?: boolean
      unresolved?: boolean
    },
)

const kindLabel = computed(() =>
  props.node.kind === 'instance' && data.value.type ? data.value.type : KIND_LABEL[props.node.kind],
)

const parentType = computed<ResourceType | undefined>(() => {
  switch (props.node.kind) {
    case 'api':
      return 'API'
    case 'component':
      return 'Component'
    case 'system':
    case 'context':
    // instances listed on a context are system instances living in it
    case 'context-node':
      return 'System'
    default:
      return undefined
  }
})

const facts = computed(() => {
  const d = data.value
  const rows: string[] = []
  if (d.abstract !== undefined) rows.push(d.abstract ? 'Abstract' : 'Concrete')
  if (d.unmapped) rows.push(d.unresolved ? 'Unresolved parent' : 'Unmapped')
  // instance type is already shown in the badge
  if (d.type && props.node.kind !== 'instance') rows.push(d.type)
  if (d.component) rows.push(d.component)
  if (d.system) rows.push(d.system)
  if (d.systemInstance) rows.push(d.systemInstance)
  if (d.context) rows.push(d.context)
  if (d.version) rows.push(`v${d.version}`)
  return rows
})

const findings = computed(() => data.value.findings ?? 0)
const findingKindRows = computed(() => (data.value.findingKinds ?? []).slice(0, MAX_FINDING_KINDS))
const moreFindingKinds = computed(() =>
  Math.max(0, (data.value.findingKinds ?? []).length - MAX_FINDING_KINDS),
)
const instanceCount = computed(() => data.value.instances ?? 0)

const description = computed(() => {
  const d = (data.value.description ?? '').trim()
  if (!d) return ''
  return d.length > MAX_DESCRIPTION ? `${d.slice(0, MAX_DESCRIPTION).trimEnd()}…` : d
})

const instanceRows = computed(() => props.instances.slice(0, MAX_INSTANCES))
const moreInstances = computed(() => Math.max(0, props.instances.length - MAX_INSTANCES))
const unresolvedCount = computed(() => props.instances.filter((i) => i.unresolved).length)

const providerRows = computed(() => props.providers.slice(0, MAX_RELATIONS))
const moreProviders = computed(() => Math.max(0, props.providers.length - MAX_RELATIONS))
const consumerRows = computed(() => props.consumers.slice(0, MAX_RELATIONS))
const moreConsumers = computed(() => Math.max(0, props.consumers.length - MAX_RELATIONS))

const stats = computed(() => {
  if (props.node.kind !== 'api') return ''
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  return [
    props.incoming ? plural(props.incoming, 'provider') : '',
    props.outgoing ? plural(props.outgoing, 'consumer') : '',
  ]
    .filter(Boolean)
    .join(' · ')
})
const showStats = computed(() => stats.value !== '')
</script>

<template>
  <div class="w-full rounded-lg border border-border-2 bg-bg-1 p-2.5 shadow-lg">
    <div class="flex items-start gap-2">
      <span
        class="mt-px shrink-0 rounded-sm px-1 font-mono text-micro bg-accent/10 text-accent-text"
      >
        {{ kindLabel }}
      </span>
      <span class="min-w-0 flex-1 break-words text-body font-medium leading-snug text-text-1">
        {{ node.data.label }}
      </span>
    </div>
    <div
      v-if="facts.length"
      class="mt-1 font-mono text-micro text-text-3"
    >
      {{ facts.join(' · ') }}
    </div>
    <div
      v-if="description"
      class="mt-1.5 break-words text-micro leading-snug text-text-2"
    >
      {{ description }}
    </div>
    <div
      v-if="data.crosses"
      class="mt-1.5 flex items-center gap-1.5 border-t border-border-1 pt-1.5 font-mono text-micro text-text-3"
    >
      <IconArrowsExchange
        :size="11"
        :stroke-width="2"
        class="shrink-0"
      />
      Crosses a context boundary
    </div>
    <div
      v-if="findingKindRows.length || findings"
      class="mt-1.5 flex flex-wrap items-center gap-1 border-t border-border-1 pt-1.5"
    >
      <span
        v-for="kind in findingKindRows"
        :key="kind"
        class="finding-chip flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-micro text-warning ring-1 ring-warning/40"
      >
        <IconAlertTriangle
          :size="9"
          :stroke-width="2"
        />
        {{ kind }}
      </span>
      <span
        v-if="moreFindingKinds"
        class="font-mono text-micro text-text-4"
      >
        +{{ moreFindingKinds }} more
      </span>
      <span
        v-if="!findingKindRows.length"
        class="finding-chip flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-micro text-warning ring-1 ring-warning/40"
      >
        <IconAlertTriangle
          :size="9"
          :stroke-width="2"
        />
        {{ findings }} finding{{ findings === 1 ? '' : 's' }}
      </span>
    </div>
    <div
      v-if="instanceRows.length"
      class="mt-1.5 border-t border-border-1 pt-1.5"
    >
      <div
        v-for="inst in instanceRows"
        :key="inst.name"
        class="flex items-center gap-1.5 py-px text-micro text-text-2"
      >
        <TypeChip
          v-if="parentType"
          :type="parentType"
          instance
          :tone="inst.unresolved ? 'error' : undefined"
        />
        <TypeChip
          v-else
          letter="I"
          label="Instance"
          :tone="inst.unresolved ? 'error' : undefined"
        />
        <span class="truncate">{{ inst.name }}</span>
      </div>
      <div
        v-if="moreInstances"
        class="pt-px font-mono text-micro text-text-4"
      >
        +{{ moreInstances }} more
      </div>
    </div>
    <div
      v-if="providerRows.length || consumerRows.length"
      class="mt-1.5 border-t border-border-1 pt-1.5"
    >
      <template v-if="providerRows.length">
        <div class="pb-0.5 text-micro font-medium uppercase tracking-wider text-text-4">
          Provided by
        </div>
        <div
          v-for="name in providerRows"
          :key="`provides:${name}`"
          class="flex items-center gap-1.5 py-px text-micro text-text-2"
        >
          <IconArrowUp
            :size="11"
            :stroke-width="1.5"
            class="shrink-0 text-text-3"
          />
          <span class="truncate">{{ name }}</span>
        </div>
        <div
          v-if="moreProviders"
          class="pt-px font-mono text-micro text-text-4"
        >
          +{{ moreProviders }} more
        </div>
      </template>
      <template v-if="consumerRows.length">
        <div
          class="pb-0.5 text-micro font-medium uppercase tracking-wider text-text-4"
          :class="providerRows.length ? 'mt-1' : ''"
        >
          Consumed by
        </div>
        <div
          v-for="name in consumerRows"
          :key="`consumes:${name}`"
          class="flex items-center gap-1.5 py-px text-micro text-text-2"
        >
          <IconArrowDown
            :size="11"
            :stroke-width="1.5"
            class="shrink-0 text-text-3"
          />
          <span class="truncate">{{ name }}</span>
        </div>
        <div
          v-if="moreConsumers"
          class="pt-px font-mono text-micro text-text-4"
        >
          +{{ moreConsumers }} more
        </div>
      </template>
    </div>
    <div
      v-if="instanceCount || unresolvedCount || showStats"
      class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border-1 pt-1.5 font-mono text-micro text-text-3"
    >
      <span v-if="instanceCount">{{ instanceCount }} inst</span>
      <span
        v-if="unresolvedCount"
        class="text-error"
      >
        {{ unresolvedCount }} unresolved
      </span>
      <span
        v-if="showStats"
        class="ml-auto"
      >
        {{ stats }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.finding-chip {
  background: color-mix(in srgb, var(--color-bg-0) 88%, var(--color-warning));
}
</style>
