<script setup lang="ts">
import { computed } from "vue";

import { CONTEXTS } from "@/lib/data";
import type { Finding, FindingType } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

type Props = {
  finding: Finding;
  types: Record<string, FindingType>;
  selected?: boolean;
  dimmed?: boolean;
  checked?: boolean;
};

type Emits = {
  select: [findingId: string];
  toggle: [findingId: string];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const type = computed(() => props.types[props.finding.typeKind]);
const severityClass = computed(() => `sev-${type.value?.severity ?? "low"}`);
const contextLabel = computed(() => CONTEXTS[props.finding.contextId]?.displayName ?? "—");
const primaryResource = computed(() => props.finding.resources[0]);

const handleRowClick = () => emit("select", props.finding.findingId);

const handleRowKeyDown = (e: KeyboardEvent) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  emit("select", props.finding.findingId);
};

const handleToggleClick = (e: MouseEvent) => {
  e.stopPropagation();
  emit("toggle", props.finding.findingId);
};

const handleToggleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  e.stopPropagation();
  emit("toggle", props.finding.findingId);
};
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="`${finding.typeKind}: ${finding.summary}`"
    :aria-selected="!!selected"
    class="row"
    :class="{ selected, dimmed }"
    @click="handleRowClick"
    @keydown="handleRowKeyDown"
  >
    <div class="bar" :class="severityClass" />
    <span
      role="checkbox"
      tabindex="0"
      :aria-checked="!!checked"
      :aria-label="checked ? 'Deselect finding' : 'Select finding'"
      class="cb"
      :class="{ checked }"
      :style="{ marginLeft: '10px' }"
      @click="handleToggleClick"
      @keydown="handleToggleKeyDown"
    />
    <span
      class="state-dot"
      :class="finding.state"
      :title="finding.state"
      :style="{ marginLeft: '0px' }"
    />
    <div class="main-col">
      <div class="kind">{{ finding.typeKind }}</div>
      <div class="summary">{{ finding.summary }}</div>
      <div class="meta">
        <span class="sensor">{{ finding.sensor }}</span>
        <span>{{ primaryResource?.resourceType }} · {{ primaryResource?.displayName }}</span>
      </div>
    </div>
    <div class="ctx" title="Context">{{ contextLabel }}</div>
    <div class="count-col" title="occurrence count">×{{ finding.count }}</div>
    <div class="time-col">{{ timeAgo(finding.lastSeen) }}</div>
  </div>
</template>
