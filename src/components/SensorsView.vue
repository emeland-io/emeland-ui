<script setup lang="ts">
import { SENSORS } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

const sensors = Object.values(SENSORS);
</script>

<template>
  <div :style="{ padding: '22px' }">
    <h2 :style="{ fontWeight: 500, letterSpacing: '-0.01em' }">Sensors</h2>
    <p :style="{ color: 'var(--text-dim)', maxWidth: '600px' }">
      Sensors feed the model server. Findings are side-effects of filter functions that inspect every event; a sensor
      going silent means the model stops converging.
    </p>
    <div
      :style="{
        display: 'grid',
        gap: '10px',
        gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
        marginTop: '20px',
      }"
    >
      <div
        v-for="sensor in sensors"
        :key="sensor.id"
        :style="{
          padding: '16px',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }">
          <span
            :style="{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: sensor.status === 'healthy' ? 'var(--accent)' : 'var(--sev-med)',
            }"
          />
          <span class="mono" :style="{ fontSize: '13px' }">{{ sensor.id }}</span>
          <span :style="{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-mute)' }">{{ sensor.kind }}</span>
        </div>
        <div :style="{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '4px' }">{{ sensor.label }}</div>
        <div :style="{ fontSize: '11px', color: 'var(--text-mute)' }">last event {{ timeAgo(sensor.lastSeen) }}</div>
      </div>
    </div>
  </div>
</template>
