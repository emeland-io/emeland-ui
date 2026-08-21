<script setup lang="ts">
/**
 * Resource/kind tag shown next to resource names in lists, detail drawers and
 * boards (e.g. "System", "Context", "ComponentInstance")
 * Autosizes to its text with clean padding; values render as-is (title case)
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
    class="inline-flex shrink-0 items-center justify-center gap-1 rounded px-1.5 py-0.5 font-mono text-meta"
    :class="
      tone === 'error'
        ? 'bg-error/10 text-error'
        : tone === 'muted'
          ? 'bg-bg-2 text-text-3'
          : 'bg-accent/10 text-accent'
    "
  >
    <slot />
  </span>
</template>
