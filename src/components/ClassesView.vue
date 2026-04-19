<script setup lang="ts">
import { FINDING_TYPES } from "@/lib/data";
import { severityVar } from "@/lib/utils";

const entries = Object.entries(FINDING_TYPES);
</script>

<template>
  <div :style="{ padding: '22px' }">
    <h2 :style="{ fontWeight: 500, letterSpacing: '-0.01em' }">Finding classes</h2>
    <p :style="{ color: 'var(--text-dim)', maxWidth: '600px' }">
      Built-in finding kinds. Each has a deterministic UUID v5 derived from the kind name, so filters can produce
      stable findings without pre-registering a FindingType resource.
    </p>
    <div :style="{ marginTop: '20px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }">
      <div
        v-for="([kind, type], i) in entries"
        :key="kind"
        :style="{
          display: 'grid',
          gridTemplateColumns: '220px 80px 1fr 260px',
          gap: '16px',
          padding: '12px 16px',
          borderTop: i ? '1px solid var(--border)' : 0,
          background: i % 2 ? 'var(--bg-1)' : 'var(--bg)',
        }"
      >
        <div class="mono" :style="{ color: 'var(--accent)', fontSize: '12px' }">{{ kind }}</div>
        <div
          class="state-badge"
          :style="{
            color: severityVar(type.severity),
            border: '1px solid var(--border)',
            alignSelf: 'center',
            textAlign: 'center',
          }"
        >
          {{ type.severity }}
        </div>
        <div :style="{ fontSize: '12px', color: 'var(--text-dim)' }">{{ type.description }}</div>
        <div class="mono" :style="{ fontSize: '10px', color: 'var(--text-mute)', alignSelf: 'center' }">
          {{ type.id }}
        </div>
      </div>
    </div>
  </div>
</template>
