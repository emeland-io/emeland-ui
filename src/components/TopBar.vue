<script setup lang="ts">
import Icon from "./Icon.vue";

type Props = { query: string };
type Emits = { "update:query": [value: string] };

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:query", target.value);
};
</script>

<template>
  <div class="topbar">
    <div class="brand">
      <div class="logo">EL</div>
      <div>
        EmELand <small>observer console</small>
      </div>
    </div>
    <span :style="{ width: '20px' }" />
    <div class="env">
      <span class="dot" />
      modelsrv · emeland.local/v1
    </div>
    <div class="spacer" />
    <div class="search">
      <Icon name="search" />
      <input
        :value="query"
        placeholder="Search findings, resources, UUIDs… (⌘K)"
        aria-label="Search findings"
        @input="handleInput"
      />
      <span class="kbd">⌘K</span>
    </div>
  </div>
</template>
