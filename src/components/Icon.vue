<script setup lang="ts">
type IconName =
  | "check"
  | "snooze"
  | "user"
  | "resolve"
  | "comment"
  | "external"
  | "search"
  | "bell"
  | "map"
  | "graph"
  | "radar"
  | "book"
  | "cog"
  | "filter"
  | "arrow";

type Props = { name: IconName; size?: number };

const props = withDefaults(defineProps<Props>(), { size: 14 });
</script>

<template>
  <svg
    v-if="props.name === 'check'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 8.5L6.5 12L13 4.5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'snooze'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M8 3.5V8L11 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4" />
  </svg>

  <svg
    v-else-if="props.name === 'user'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="6" r="2.6" stroke="currentColor" stroke-width="1.4" />
    <path
      d="M3 13c.8-2.3 2.7-3.3 5-3.3s4.2 1 5 3.3"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'resolve'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4" />
    <path
      d="M5.5 8L7 9.5L10.5 6"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'comment'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 4a1 1 0 011-1h8a1 1 0 011 1v6a1 1 0 01-1 1H7l-3 2.5V11H4a1 1 0 01-1-1V4z"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'external'"
    :width="props.size === 14 ? 12 : props.size"
    :height="props.size === 14 ? 12 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M6 3H3v10h10v-3M10 3h3v3M13 3l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
  </svg>

  <svg
    v-else-if="props.name === 'search'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.5" />
    <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>

  <svg
    v-else-if="props.name === 'bell'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 2.5c-2.2 0-4 1.8-4 4v2.8l-1 1.7h10l-1-1.7V6.5c0-2.2-1.8-4-4-4zM6.5 13a1.5 1.5 0 003 0"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'map'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M2 4v10l4-2 4 2 4-2V2l-4 2-4-2-4 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
    <path d="M6 2v10M10 4v10" stroke="currentColor" stroke-width="1.4" />
  </svg>

  <svg
    v-else-if="props.name === 'radar'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3" />
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3" />
    <circle cx="8" cy="8" r="0.8" fill="currentColor" />
  </svg>

  <svg
    v-else-if="props.name === 'book'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 3h4a2 2 0 012 2v8a2 2 0 00-2-2H3V3zM13 3H9a2 2 0 00-2 2v8a2 2 0 012-2h4V3z"
      stroke="currentColor"
      stroke-width="1.3"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'cog'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4" />
    <path
      d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M3.8 12.2l1.4-1.4M10.8 5.2l1.4-1.4"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
    />
  </svg>

  <svg
    v-else-if="props.name === 'filter'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M2 3h12l-4.5 6V13l-3 1v-5L2 3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
  </svg>

  <svg
    v-else-if="props.name === 'graph'"
    :width="props.size === 14 ? 15 : props.size"
    :height="props.size === 14 ? 15 : props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="3.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3" />
    <circle cx="12.5" cy="4" r="1.6" stroke="currentColor" stroke-width="1.3" />
    <circle cx="8" cy="12" r="1.6" stroke="currentColor" stroke-width="1.3" />
    <path d="M4.7 5.2L7.2 10.7M11.3 5.2L8.8 10.7M5 4h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
  </svg>

  <svg
    v-else-if="props.name === 'arrow'"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
