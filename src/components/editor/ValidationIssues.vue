<script setup lang="ts">
import type { ValidationIssue } from '@/editor/document'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-vue'

defineProps<{
  issues: ValidationIssue[]
  valid: boolean
}>()
</script>

<template>
  <div
    class="flex items-start gap-2 rounded border px-3 py-2"
    :class="
      valid
        ? 'border-accent/25 bg-accent/5 text-accent-text'
        : 'border-error/25 bg-error/5 text-error'
    "
  >
    <IconCircleCheck
      v-if="valid"
      :size="15"
      :stroke-width="1.75"
      class="mt-0.5 shrink-0"
    />
    <IconAlertCircle
      v-else
      :size="15"
      :stroke-width="1.75"
      class="mt-0.5 shrink-0"
    />
    <div class="min-w-0 flex-1">
      <p
        v-if="valid"
        class="text-label font-medium"
      >
        Document is valid for export
      </p>
      <template v-else>
        <p class="text-label font-medium">
          {{ issues.length }} validation {{ issues.length === 1 ? 'issue' : 'issues' }}
        </p>
        <ul class="mt-1 space-y-0.5 font-mono text-meta">
          <li
            v-for="(issue, i) in issues"
            :key="i"
          >
            <span
              v-if="issue.path"
              class="opacity-70"
            >
              {{ issue.path }}:
            </span>
            {{ issue.message }}
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
