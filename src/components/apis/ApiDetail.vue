<script setup lang="ts">
import { computed } from 'vue'
import { IconArrowsExchange, IconLayoutSidebarRight } from '@tabler/icons-vue'
import { useApiStore } from '@/stores/apis'
import { useSystemStore } from '@/stores/systems'
import { useComponentStore } from '@/stores/components'
import { useContextStore } from '@/stores/contexts'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import { useInstanceContext } from '@/composables/useInstanceContext'
import CopyButton from '@/components/CopyButton.vue'
import TypeGlyph from '@/components/TypeGlyph.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import TypeTag from '@/components/TypeTag.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import { endpointUrl } from '@/utils/endpoint'
import { differingAnnotationKeys } from '@/utils/annotations'
import type { Api } from '@/types/api'
import type { ApiContextFlow } from '@/utils/apiContexts'

const props = defineProps<{
  api: Api | undefined
  flow?: ApiContextFlow
  activeInstanceId?: string
}>()

const emit = defineEmits<{
  'open-instance': [id: string]
}>()

const store = useApiStore()
const systemStore = useSystemStore()
const componentStore = useComponentStore()
const contextStore = useContextStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

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

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.api?.apiId ?? '',
)

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

const { contextForInstance } = useInstanceContext()

const instanceRows = computed(() =>
  instances.value
    .map((inst) => ({
      inst,
      url: endpointUrl(inst.annotations),
      context: contextForInstance(inst).name,
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
</script>

<template>
  <div
    v-if="api"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="api.apiId"
      :title="api.displayName"
      :version="api.version"
    >
      <TypeTag :tone="api.type === 'Unknown' ? 'muted' : 'accent'">{{ api.type }}</TypeTag>
      <TypeTag
        v-if="api.version?.version"
        tone="muted"
      >
        v{{ api.version.version }}
      </TypeTag>
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner v-if="store.hasDetailError(api.apiId)" />
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
            <ResourceLinkCard
              v-else-if="!systemUnresolved"
              :id="api.system"
              badge="System"
              :name="systemName ?? api.system"
              title="Go to system"
              @click="goToResource('System', api.system)"
            />
            <ResourceLinkCard
              v-else
              :id="api.system"
              badge="System"
              badge-error
              name="Unresolved system"
              name-error
              :clickable="false"
              :copyable="false"
            />
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
                <ResourceLinkCard
                  v-for="ctx in flow.providerContexts"
                  :id="ctx"
                  :key="ctx"
                  :name="contextName(ctx)"
                  arrow-end
                  title="Go to context"
                  @click="goToResource('Context', ctx)"
                />
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
                <ResourceLinkCard
                  v-for="ctx in flow.consumerContexts"
                  :id="ctx"
                  :key="ctx"
                  :name="contextName(ctx)"
                  arrow-end
                  title="Go to context"
                  @click="goToResource('Context', ctx)"
                >
                  <template #trailing>
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
                  </template>
                </ResourceLinkCard>
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
            <ResourceLinkCard
              v-for="c in providers"
              :id="c.componentId"
              :key="c.componentId"
              badge="Component"
              :name="c.displayName"
              title="Go to component"
              @click="goToResource('Component', c.componentId)"
            />
          </div>
          <!-- Related findings -->
          <DetailFindingsSection :findings="relatedFindings" />
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
            <ResourceLinkCard
              v-for="c in consumers"
              :id="c.componentId"
              :key="c.componentId"
              badge="Component"
              :name="c.displayName"
              title="Go to component"
              @click="goToResource('Component', c.componentId)"
            />
          </div>
          <!-- Annotations -->
          <DetailAnnotationsSection :annotations="api.annotations" />
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
                <IconLayoutSidebarRight
                  v-if="row.inst.apiInstanceId === activeInstanceId"
                  :size="13"
                  :stroke-width="1.75"
                  class="shrink-0 text-text-3"
                  aria-label="Shown in drawer"
                />
                <span
                  class="min-w-0 flex-1 truncate text-body transition-colors"
                  :class="
                    row.inst.apiInstanceId === activeInstanceId
                      ? 'text-text-1'
                      : 'text-text-2 group-hover:text-accent'
                  "
                >
                  {{ row.inst.displayName }}
                </span>
                <span
                  v-if="row.context"
                  class="flex shrink-0 items-center gap-1 font-mono text-micro text-text-4"
                  :title="row.systemInstance"
                >
                  <TypeGlyph type="Context" />
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
  <DetailEmptyState
    v-else
    label="Select an API to inspect"
  />
</template>
