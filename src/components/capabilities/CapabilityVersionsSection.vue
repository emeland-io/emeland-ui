<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconChevronRight } from '@tabler/icons-vue'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import { useResourceNav } from '@/composables/useResourceNav'
import ParameterValueList from '@/components/parameters/ParameterValueList.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import SectionLabel from '@/components/SectionLabel.vue'
import TypeTag from '@/components/TypeTag.vue'
import CopyButton from '@/components/CopyButton.vue'
import { latestVersionRef, versionDates, versionStatus, type VersionStatus } from '@/utils/version'
import { pluralize } from '@/utils/text'
import type { Capability, Variant } from '@/types/capability'
import type { Version } from '@/types/common'

const props = defineProps<{
  capability: Capability
}>()

const store = useCapabilitiesStore()
const parametersStore = useParametersStore()
const { goToResource } = useResourceNav()

const expandedVersions = ref<Set<string>>(new Set())

const STATUS: Record<
  VersionStatus,
  { tone: 'accent' | 'muted' | 'warning' | 'error'; label: string }
> = {
  available: { tone: 'accent', label: 'Available' },
  upcoming: { tone: 'muted', label: 'Upcoming' },
  deprecated: { tone: 'warning', label: 'Deprecated' },
  terminated: { tone: 'error', label: 'Terminated' },
}

const sortedVersions = computed(() =>
  [...(props.capability.versions ?? [])].sort(
    (a, b) =>
      (b.version?.version ?? '').localeCompare(a.version?.version ?? '', undefined, {
        numeric: true,
      }) || a.capabilityVersionId.localeCompare(b.capabilityVersionId),
  ),
)

const latestId = computed(() => latestVersionRef(props.capability.versions)?.capabilityVersionId)

// keyed on latestId too: detail hydration replaces the capability under the
// same id, and the versions may only arrive then
watch(
  () => [props.capability.capabilityId, latestId.value] as const,
  () => {
    expandedVersions.value = latestId.value ? new Set([latestId.value]) : new Set()
  },
  { immediate: true },
)

function isExpanded(id: string): boolean {
  return expandedVersions.value.has(id)
}

function toggle(id: string) {
  const next = new Set(expandedVersions.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedVersions.value = next
}

function parameterName(parameterId: string): string {
  return parametersStore.parameterMap.get(parameterId)?.displayName ?? parameterId
}

function variantDependencies(variant: Variant) {
  return (variant.dependencies ?? []).map((d) => {
    const cap = store.capabilityMap.get(d.capability)
    const requires = (d.outputParameters ?? []).map(
      (op) => `${parameterName(op.parameter)} ${op.values.join(' / ')}`,
    )
    return {
      id: d.capability,
      name: cap?.displayName,
      description: cap?.description,
      unresolved: !cap,
      requiresLine: requires.length > 0 ? requires.join(' · ') : '',
    }
  })
}

function lifecycleTitle(v: Version): string {
  return versionDates(v)
    .map(([label, value]) => `${label} ${value}`)
    .join(' · ')
}

/** muted second line on the version row when collapsed */
function rowSubtitle(v: (typeof sortedVersions.value)[number]): string | undefined {
  if (isExpanded(v.capabilityVersionId)) return undefined
  const parts: string[] = []
  if (v.capabilityVersionId === latestId.value) parts.push('latest')
  const count = v.variants?.length ?? 0
  if (count > 0) parts.push(pluralize(count, 'variant'))
  return parts.length > 0 ? parts.join(' · ') : undefined
}
</script>

<template>
  <div>
    <SectionLabel :count="sortedVersions.length">Versions</SectionLabel>
    <p
      v-if="sortedVersions.length === 0"
      class="text-data leading-snug text-text-4"
    >
      No versions offered yet.
    </p>

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <div
        v-for="v in sortedVersions"
        :key="v.capabilityVersionId"
        class="group/vrow overflow-hidden rounded-md border border-border-1 bg-bg-1"
      >
        <button
          type="button"
          class="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-bg-2"
          @click="toggle(v.capabilityVersionId)"
        >
          <IconChevronRight
            :size="14"
            :stroke-width="2"
            class="mt-0.5 shrink-0 text-text-4 transition-transform"
            :class="isExpanded(v.capabilityVersionId) ? 'rotate-90' : ''"
          />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-body font-medium text-text-1">
                v{{ v.version?.version ?? '?' }}
              </span>
              <TypeTag
                v-if="v.version"
                :tone="STATUS[versionStatus(v.version)].tone"
              >
                {{ STATUS[versionStatus(v.version)].label }}
              </TypeTag>
              <span
                v-if="
                  v.capabilityVersionId === latestId &&
                  v.version &&
                  isExpanded(v.capabilityVersionId)
                "
                class="font-mono text-meta text-text-4"
              >
                latest
              </span>
            </span>
            <span
              v-if="rowSubtitle(v)"
              class="mt-0.5 block font-mono text-meta text-text-4"
            >
              {{ rowSubtitle(v) }}
            </span>
          </span>
          <span
            class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/vrow:opacity-100"
            @click.stop
          >
            <span
              class="font-mono text-micro text-text-4"
              :title="v.capabilityVersionId"
            >
              {{ v.capabilityVersionId.slice(0, 8) }}…
            </span>
            <CopyButton
              :value="v.capabilityVersionId"
              :size="12"
              label="Copy version id"
            />
          </span>
        </button>

        <div
          v-if="isExpanded(v.capabilityVersionId)"
          class="space-y-4 border-t border-border-1 px-3 py-3"
        >
          <div
            v-if="v.version"
            :title="lifecycleTitle(v.version)"
          >
            <div
              v-for="[label, value] in versionDates(v.version)"
              :key="label"
              class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-1 py-1.5 last:border-b-0"
            >
              <span class="text-data text-text-3">{{ label }}</span>
              <span class="font-mono text-data tabular-nums text-text-1">
                {{ value.slice(0, 10) }}
              </span>
            </div>
          </div>

          <div v-if="(v.variants?.length ?? 0) > 0">
            <SectionLabel :count="v.variants!.length">Variants</SectionLabel>
            <div class="flex flex-col gap-2">
              <div
                v-for="(variant, i) in v.variants"
                :key="i"
                class="rounded-md border border-border-1 bg-bg-0 px-3 py-2.5"
              >
                <span class="text-data text-text-3">Variant {{ i + 1 }}</span>

                <ParameterValueList
                  v-if="variant.inputParameters?.length"
                  class="mt-2"
                  :entries="
                    variant.inputParameters.map((input) => ({
                      parameterId: input.parameter,
                      values: input.values,
                    }))
                  "
                />
                <p
                  v-else
                  class="mt-2 text-meta text-text-4"
                >
                  Any parameter values
                </p>

                <div
                  v-if="variantDependencies(variant).length > 0"
                  class="mt-3 border-t border-border-1 pt-2"
                >
                  <div class="mb-1 text-data text-text-3">
                    Requires
                    <span class="ml-1 font-mono tabular-nums text-text-4">
                      {{ variantDependencies(variant).length }}
                    </span>
                  </div>
                  <ResourceLinkCard
                    v-for="dep in variantDependencies(variant)"
                    :id="dep.id"
                    :key="dep.id"
                    badge="Capability"
                    :badge-error="dep.unresolved"
                    :name="dep.name ?? 'Unresolved capability'"
                    :name-error="dep.unresolved"
                    :clickable="!dep.unresolved"
                    :copyable="false"
                    title="Go to capability"
                    @click="goToResource('Capability', dep.id)"
                  >
                    <template
                      v-if="dep.description || dep.requiresLine"
                      #subline
                    >
                      <span class="flex min-w-0 flex-col gap-0.5">
                        <span
                          v-if="dep.description"
                          class="truncate text-meta text-text-4"
                        >
                          {{ dep.description }}
                        </span>
                        <span
                          v-if="dep.requiresLine"
                          class="truncate font-mono text-meta text-text-3"
                          :title="dep.requiresLine"
                        >
                          {{ dep.requiresLine }}
                        </span>
                      </span>
                    </template>
                  </ResourceLinkCard>
                </div>
              </div>
            </div>
          </div>
          <p
            v-else
            class="text-data leading-snug text-text-4"
          >
            No variants for this version.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
