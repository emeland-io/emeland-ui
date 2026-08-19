<script setup lang="ts">
import SectionLabel from '@/components/SectionLabel.vue'
import FindingCard from '@/components/detail/FindingCard.vue'
import { useResourceNav } from '@/composables/useResourceNav'
import type { Finding } from '@/types/finding'

defineProps<{
  findings: Finding[]
}>()

const { goToFinding } = useResourceNav()
</script>

<template>
  <div>
    <SectionLabel
      :count="findings.length"
      tone="warning"
    >
      Findings
    </SectionLabel>
    <p
      v-if="findings.length === 0"
      class="text-data leading-snug text-text-4"
    >
      No findings.
    </p>
    <FindingCard
      v-for="f in findings"
      :key="f.findingId"
      :finding="f"
      @open="goToFinding"
    />
  </div>
</template>
