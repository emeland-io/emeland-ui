<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComponentStore } from '@/stores/components'
import { useSystemStore } from '@/stores/systems'
import { useApiStore } from '@/stores/apis'
import { useFindingsStore } from '@/stores/findings'
import { useResourceNav } from '@/composables/useResourceNav'
import { useFindingsForResource } from '@/composables/useFindingsForResource'
import SectionLabel from '@/components/SectionLabel.vue'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import DetailHeader from '@/components/detail/DetailHeader.vue'
import TypeTag from '@/components/TypeTag.vue'
import DetailFindingsSection from '@/components/detail/DetailFindingsSection.vue'
import DetailAnnotationsSection from '@/components/detail/DetailAnnotationsSection.vue'
import DetailEmptyState from '@/components/detail/DetailEmptyState.vue'
import ResourceLinkCard from '@/components/detail/ResourceLinkCard.vue'
import ApiChipCloud from '@/components/apis/ApiChipCloud.vue'
import ComponentInstancesBoard from '@/components/components/ComponentInstancesBoard.vue'
import ComponentInstanceDrawer from '@/components/components/ComponentInstanceDrawer.vue'
import type { Component } from '@/types/component'

const props = defineProps<{
  component: Component | undefined
}>()

const store = useComponentStore()
const systemStore = useSystemStore()
const apiStore = useApiStore()
const findingsStore = useFindingsStore()
const { goToResource } = useResourceNav()

const systemName = computed(() =>
  props.component ? systemStore.systemMap.get(props.component.system)?.displayName : undefined,
)
const systemUnresolved = computed(
  () => !!props.component?.system && !systemStore.systemMap.has(props.component.system),
)

const provides = computed(() =>
  (props.component?.provides ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)
const consumes = computed(() =>
  (props.component?.consumes ?? []).map((id) => ({ id, name: apiStore.getApiName(id) ?? id })),
)

const relatedFindings = useFindingsForResource(
  () => findingsStore.findings,
  () => props.component?.componentId ?? '',
)

const instances = computed(() =>
  props.component ? store.getInstancesForComponent(props.component.componentId) : [],
)

const drawerOpen = ref(false)
const selectedInstanceId = ref('')

function openInstance(id: string) {
  selectedInstanceId.value = id
  drawerOpen.value = true
}
</script>

<template>
  <div
    v-if="component"
    class="@container flex-1 overflow-y-auto"
  >
    <DetailHeader
      :id="component.componentId"
      :title="component.displayName"
      :version="component.version"
    >
      <TypeTag>Component</TypeTag>
      <TypeTag
        v-if="component.version?.version"
        tone="muted"
      >
        v{{ component.version.version }}
      </TypeTag>
    </DetailHeader>
    <div class="flex flex-col gap-5 px-6 py-5">
      <DetailErrorBanner v-if="store.hasDetailError(component.componentId)" />
      <div
        class="grid gap-x-8 gap-y-5 @3xl:grid-cols-3 @3xl:[&>*:nth-child(2)]:border-l @3xl:[&>*:nth-child(2)]:border-border-1/50 @3xl:[&>*:nth-child(2)]:pl-8 @3xl:[&>*:nth-child(3)]:border-l @3xl:[&>*:nth-child(3)]:border-border-1/50 @3xl:[&>*:nth-child(3)]:pl-8"
      >
        <div class="flex flex-col gap-6">
          <div>
            <!-- description -->
            <p
              v-if="component.description"
              class="text-body leading-relaxed text-text-2"
            >
              {{ component.description }}
            </p>
          </div>
          <div>
            <SectionLabel>System</SectionLabel>
            <p
              v-if="!component.system"
              class="text-data leading-snug text-text-4"
            >
              No system.
            </p>
            <ResourceLinkCard
              v-else-if="!systemUnresolved"
              :id="component.system"
              badge="System"
              :name="systemName ?? component.system"
              title="Go to system"
              @click="goToResource('System', component.system)"
            />
            <ResourceLinkCard
              v-else
              :id="component.system"
              badge="System"
              badge-error
              name="Unresolved system"
              name-error
              :clickable="false"
              :copyable="false"
            />
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div>
            <div>
              <SectionLabel :count="provides.length">Provides APIs</SectionLabel>
              <p
                v-if="provides.length === 0"
                class="text-data leading-snug text-text-4"
              >
                Provides no interfaces.
              </p>
              <ApiChipCloud
                v-else
                :apis="provides"
                @open="goToResource('API', $event)"
              />
            </div>
          </div>
          <!-- Related findings -->
          <DetailFindingsSection :findings="relatedFindings" />
        </div>
        <div class="flex flex-col gap-6 @3xl:row-span-2">
          <div>
            <!-- Consumes -->
            <div>
              <SectionLabel :count="consumes.length">Consumes APIs</SectionLabel>
              <p
                v-if="consumes.length === 0"
                class="text-data leading-snug text-text-4"
              >
                Consumes no interfaces.
              </p>
              <ApiChipCloud
                v-else
                :apis="consumes"
                tone="muted"
                @open="goToResource('API', $event)"
              />
            </div>
          </div>
          <div class="@3xl:col-start-3">
            <!-- Annotations -->
            <DetailAnnotationsSection :annotations="component.annotations" />
          </div>
        </div>
        <div class="@3xl:col-span-2">
          <!-- Instances -->
          <ComponentInstancesBoard
            v-if="instances.length > 0"
            :instances="instances"
            :active-instance-id="drawerOpen ? selectedInstanceId : ''"
            @select="openInstance"
          />
        </div>
      </div>
    </div>

    <ComponentInstanceDrawer
      :open="drawerOpen"
      :selected-instance-id="selectedInstanceId"
      :nav-ids="instances.map((i) => i.componentInstanceId)"
      @close="drawerOpen = false"
      @navigate="(id) => (selectedInstanceId = id)"
    />
  </div>
  <DetailEmptyState
    v-else
    label="Select a component to inspect"
  />
</template>
