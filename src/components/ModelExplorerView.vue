<script setup lang="ts">
import { computed, ref } from "vue";

import { RESOURCE_INDEX, RESOURCE_TYPES, countByType, resourcesOfType } from "@/lib/model";
import type { ModelRelation, ModelResource } from "@/lib/types";

import Icon from "./Icon.vue";

const counts = countByType();

const selectedTypeId = ref<string>(RESOURCE_TYPES[0].id);
const selectedResourceId = ref<string | null>(resourcesOfType(RESOURCE_TYPES[0].id)[0]?.id ?? null);
const query = ref("");

const selectedType = computed(() =>
  RESOURCE_TYPES.find((t) => t.id === selectedTypeId.value) ?? RESOURCE_TYPES[0]
);

const resourcesForType = computed<ModelResource[]>(() => resourcesOfType(selectedType.value.id));

const filteredResources = computed<ModelResource[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return resourcesForType.value;
  return resourcesForType.value.filter(
    (r) => r.displayName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
  );
});

const selectedResource = computed<ModelResource | null>(() => {
  const id = selectedResourceId.value;
  if (id) {
    const found = RESOURCE_INDEX.get(id);
    if (found) return found;
  }
  return filteredResources.value[0] ?? null;
});

const handleTypeSelect = (typeId: string) => {
  selectedTypeId.value = typeId;
  query.value = "";
  selectedResourceId.value = resourcesOfType(typeId)[0]?.id ?? null;
};

const handleTypeKey = (e: KeyboardEvent, typeId: string) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  handleTypeSelect(typeId);
};

const handleResourceSelect = (id: string) => {
  selectedResourceId.value = id;
};

const handleResourceKey = (e: KeyboardEvent, id: string) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  handleResourceSelect(id);
};

const handleRelationClick = (relation: ModelRelation) => {
  selectedTypeId.value = relation.targetType;
  selectedResourceId.value = relation.targetId;
  query.value = "";
};

const handleRelationKey = (e: KeyboardEvent, relation: ModelRelation) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  handleRelationClick(relation);
};

const handleQueryInput = (e: Event) => {
  query.value = (e.target as HTMLInputElement).value;
};

const relationTargetName = (relation: ModelRelation): string =>
  RESOURCE_INDEX.get(relation.targetId)?.displayName ?? relation.targetId;

const relationsByName = computed<{ name: string; items: ModelRelation[] }[]>(() => {
  if (!selectedResource.value) return [];
  const grouped = new Map<string, ModelRelation[]>();
  for (const rel of selectedResource.value.relations) {
    const list = grouped.get(rel.name);
    if (list) list.push(rel);
    else grouped.set(rel.name, [rel]);
  }
  return Array.from(grouped.entries()).map(([name, items]) => ({ name, items }));
});
</script>

<template>
  <div class="explorer">
    <!-- Left rail: resource types -->
    <aside class="explorer-types" aria-label="Resource types">
      <div class="explorer-section-header">Resource types</div>
      <div
        v-for="type in RESOURCE_TYPES"
        :key="type.id"
        role="button"
        tabindex="0"
        :aria-label="`type ${type.displayName}`"
        :aria-current="selectedTypeId === type.id ? 'true' : undefined"
        class="explorer-type"
        :class="{ active: selectedTypeId === type.id }"
        @click="handleTypeSelect(type.id)"
        @keydown="(e: KeyboardEvent) => handleTypeKey(e, type.id)"
      >
        <span class="explorer-type-name">{{ type.displayName }}</span>
        <span class="explorer-type-count">{{ counts[type.id] ?? 0 }}</span>
      </div>
    </aside>

    <!-- Middle: filterable resource list -->
    <section class="explorer-list" aria-label="Resources of selected type">
      <div class="explorer-list-header">
        <div class="explorer-list-title">{{ selectedType.displayName }}</div>
        <div class="explorer-search">
          <Icon name="search" />
          <input
            :value="query"
            :placeholder="`filter ${selectedType.displayName}…`"
            :aria-label="`filter ${selectedType.displayName}`"
            @input="handleQueryInput"
          />
        </div>
      </div>
      <div class="explorer-list-body">
        <div v-if="filteredResources.length === 0" class="empty" :style="{ padding: '20px' }">
          No resources match.
        </div>
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          role="button"
          tabindex="0"
          :aria-label="`resource ${resource.displayName}`"
          :aria-selected="selectedResource?.id === resource.id"
          class="explorer-resource"
          :class="{ active: selectedResource?.id === resource.id }"
          @click="handleResourceSelect(resource.id)"
          @keydown="(e: KeyboardEvent) => handleResourceKey(e, resource.id)"
        >
          <div class="explorer-resource-name">{{ resource.displayName }}</div>
          <div class="explorer-resource-id">{{ resource.id }}</div>
        </div>
      </div>
    </section>

    <!-- Right: detail with clickable relations -->
    <section class="explorer-detail" aria-label="Resource detail">
      <div v-if="!selectedResource" class="empty" :style="{ flex: 1 }">Select a resource.</div>
      <template v-else>
        <header class="detail-header">
          <div class="kind-row">
            <span class="pill">{{ selectedResource.type }}</span>
            <span :style="{ flex: 1 }" />
            <span class="uuid">{{ selectedResource.id }}</span>
          </div>
          <h1>{{ selectedResource.displayName }}</h1>
          <p v-if="selectedResource.description" class="desc">{{ selectedResource.description }}</p>
        </header>

        <div class="detail-body">
          <div v-if="Object.keys(selectedResource.attributes).length > 0" class="section">
            <h3>Attributes</h3>
            <div class="kv-grid">
              <template v-for="(value, key) in selectedResource.attributes" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ value }}</dd>
              </template>
            </div>
          </div>

          <div v-if="relationsByName.length > 0" class="section">
            <h3>Relations</h3>
            <div
              v-for="group in relationsByName"
              :key="group.name"
              class="relation-group"
            >
              <div class="relation-name">{{ group.name }}</div>
              <div class="relation-targets">
                <span
                  v-for="rel in group.items"
                  :key="`${rel.name}-${rel.targetId}`"
                  role="button"
                  tabindex="0"
                  :aria-label="`go to ${rel.targetType} ${relationTargetName(rel)}`"
                  class="relation-link"
                  @click="handleRelationClick(rel)"
                  @keydown="(e: KeyboardEvent) => handleRelationKey(e, rel)"
                >
                  <span class="relation-type">{{ rel.targetType }}</span>
                  <span class="relation-target">{{ relationTargetName(rel) }}</span>
                  <Icon name="arrow" :size="12" />
                </span>
              </div>
            </div>
          </div>
          <div v-else class="section">
            <h3>Relations</h3>
            <div class="desc">No outgoing relations.</div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>
