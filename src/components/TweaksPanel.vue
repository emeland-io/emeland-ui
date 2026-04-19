<script setup lang="ts">
import type { Tweaks } from "@/lib/types";

type TweakKey = keyof Tweaks;

type Props = { tweaks: Tweaks };
type Emits = {
  "update:tweak": [key: TweakKey, value: Tweaks[TweakKey]];
  close: [];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const setTweak = <K extends TweakKey>(key: K, value: Tweaks[K]) => {
  emit("update:tweak", key, value);
};

const handleClose = () => emit("close");

const handleOptKeyDown = <K extends TweakKey>(e: KeyboardEvent, key: K, value: Tweaks[K]) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  setTweak(key, value);
};

const isActive = <K extends TweakKey>(key: K, value: Tweaks[K]) => props.tweaks[key] === value;
</script>

<template>
  <div class="tweaks-panel" role="dialog" aria-label="Display tweaks">
    <h4>
      Tweaks
      <span :style="{ flex: 1 }" />
      <button
        type="button"
        class="btn ghost"
        aria-label="Close tweaks"
        :style="{ padding: '2px 6px', fontSize: '11px' }"
        @click="handleClose"
      >
        ×
      </button>
    </h4>

    <div class="tweak-row">
      <label>Theme</label>
      <div class="opts">
        <span
          v-for="value in (['dark', 'light', 'paper', 'amber'] as const)"
          :key="value"
          role="button"
          tabindex="0"
          :aria-pressed="isActive('theme', value)"
          :aria-label="`theme: ${value}`"
          class="opt"
          :class="{ active: isActive('theme', value) }"
          @click="setTweak('theme', value)"
          @keydown="(e: KeyboardEvent) => handleOptKeyDown(e, 'theme', value)"
        >
          {{ value.charAt(0).toUpperCase() + value.slice(1) }}
        </span>
      </div>
    </div>

    <div class="tweak-row">
      <label>Density</label>
      <div class="opts">
        <span
          v-for="value in (['comfortable', 'dense'] as const)"
          :key="value"
          role="button"
          tabindex="0"
          :aria-pressed="isActive('density', value)"
          :aria-label="`density: ${value}`"
          class="opt"
          :class="{ active: isActive('density', value) }"
          @click="setTweak('density', value)"
          @keydown="(e: KeyboardEvent) => handleOptKeyDown(e, 'density', value)"
        >
          {{ value.charAt(0).toUpperCase() + value.slice(1) }}
        </span>
      </div>
    </div>

    <div class="tweak-row">
      <label>Layout</label>
      <div class="opts">
        <span
          v-for="(entry) in ([['split', 'Split'], ['full-detail', 'Full']] as const)"
          :key="entry[0]"
          role="button"
          tabindex="0"
          :aria-pressed="isActive('layout', entry[0])"
          :aria-label="`layout: ${entry[1]}`"
          class="opt"
          :class="{ active: isActive('layout', entry[0]) }"
          @click="setTweak('layout', entry[0])"
          @keydown="(e: KeyboardEvent) => handleOptKeyDown(e, 'layout', entry[0])"
        >
          {{ entry[1] }}
        </span>
      </div>
    </div>

    <div class="tweak-row">
      <label>Group by</label>
      <div class="opts">
        <span
          v-for="value in (['none', 'kind', 'context', 'sensor'] as const)"
          :key="value"
          role="button"
          tabindex="0"
          :aria-pressed="isActive('groupBy', value)"
          :aria-label="`groupBy: ${value}`"
          class="opt"
          :class="{ active: isActive('groupBy', value) }"
          @click="setTweak('groupBy', value)"
          @keydown="(e: KeyboardEvent) => handleOptKeyDown(e, 'groupBy', value)"
        >
          {{ value.charAt(0).toUpperCase() + value.slice(1) }}
        </span>
      </div>
    </div>
  </div>
</template>
