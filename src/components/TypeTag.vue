<script setup lang="ts">
/**
 * Uppercase resource/kind tag shown next to resource names in detail drawers and
 * boards (e.g. "SYSTEM", "CONTEXT", "COMPONENTINSTANCE"). Autosizes to its text
 * with clean padding.
 *
 *   <Tag>System</Tag>
 *   <Tag tone="error">Context</Tag>
 *   <Tag :tone="abstract ? 'muted' : 'accent'">{{ kind }}</Tag>
 *
 */
withDefaults(
  defineProps<{
    tone?: 'accent' | 'error' | 'muted'
  }>(),
  { tone: 'accent' },
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center gap-1 rounded px-2 py-0.5 font-mono text-meta font-semibold uppercase"
    :class="
      tone === 'error'
        ? 'bg-error/10 text-error'
        : tone === 'muted'
          ? 'bg-bg-2 text-text-3'
          : 'bg-accent/10 text-accent-text'
    "
  >
    <slot />
  </span>
</template>
