<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import type { Finding, ModalKind } from "@/lib/types";

type ModalConfig = { title: string; placeholder: string; cta: string };

const CONFIGS: Record<ModalKind, ModalConfig> = {
  resolve: {
    title: "Resolve finding",
    placeholder: 'Reason (e.g. "Product team pushed the missing API manifest")',
    cta: "Resolve",
  },
  assign: {
    title: "Assign finding",
    placeholder: "@username or team (e.g. @maya, team-payments)",
    cta: "Assign",
  },
  link: {
    title: "Link external ticket",
    placeholder: "https://jira.../PAY-1234 or github.com/…/issues/42",
    cta: "Link",
  },
};

type Props = { kind: ModalKind; target: Finding };
type Emits = { close: []; submit: [value: string] };

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const value = ref("");

const config = computed<ModalConfig>(() => CONFIGS[props.kind]);

const handleClose = () => emit("close");

const handleSubmit = () => {
  const trimmed = value.value.trim();
  if (!trimmed) return;
  emit("submit", trimmed);
};

const handleModalClick = (e: MouseEvent) => e.stopPropagation();

const handleBackdropKeyDown = (e: KeyboardEvent) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  handleClose();
};

const handleDocKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") handleClose();
};

onMounted(() => window.addEventListener("keydown", handleDocKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleDocKeyDown));
</script>

<template>
  <div
    role="button"
    tabindex="0"
    aria-label="Close modal"
    class="modal-backdrop"
    @click="handleClose"
    @keydown="handleBackdropKeyDown"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="config.title"
      class="modal"
      @click="handleModalClick"
    >
      <h3>{{ config.title }}</h3>
      <div :style="{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }">
        {{ props.target?.summary }}
      </div>
      <textarea
        v-model="value"
        autofocus
        :placeholder="config.placeholder"
        :aria-label="config.title"
      />
      <div :style="{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '12px' }">
        <button type="button" class="btn ghost" @click="handleClose">Cancel</button>
        <button type="button" class="btn primary" @click="handleSubmit">{{ config.cta }}</button>
      </div>
    </div>
  </div>
</template>
