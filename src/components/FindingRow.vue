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
};

type Emits = { select: [findingId: string] };

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
