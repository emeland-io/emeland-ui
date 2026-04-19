<script setup lang="ts">
type Rule = {
  id: string;
  phase: string;
  kind: string;
  scope: string;
  enabled: boolean;
  fires: number;
  desc: string;
};

const RULES: Rule[] = [
  {
    id: "phase0.contextType",
    phase: "phase 0",
    kind: "ContextTypeMissing",
    scope: "Context Create|Update",
    enabled: true,
    fires: 14,
    desc: "Fires when a Context has no type, or references a ContextType UUID not registered in the model.",
  },
  {
    id: "phase0.contextParent",
    phase: "phase 0",
    kind: "ContextParentNotFound",
    scope: "Context Create|Update",
    enabled: true,
    fires: 3,
    desc: "Fires when Context.parent references a UUID that does not exist. Null parent is valid.",
  },
  {
    id: "phase0.nodeType",
    phase: "phase 0",
    kind: "NodeTypeMissing",
    scope: "Node Create|Update",
    enabled: true,
    fires: 2,
    desc: "Fires when a Node has no NodeType assigned.",
  },
  {
    id: "phase1.apiInstApi",
    phase: "phase 1",
    kind: "ApiInstanceApiMissing",
    scope: "ApiInstance Create|Update",
    enabled: true,
    fires: 6,
    desc: "Fires when ApiInstance.api references an unknown API UUID.",
  },
  {
    id: "phase1.compApi",
    phase: "phase 1",
    kind: "ComponentConsumesUnknownApi",
    scope: "Component Create|Update",
    enabled: true,
    fires: 9,
    desc: "Fires when Component.consumes references an API UUID not in the landscape.",
  },
  {
    id: "phase1.sysInstCtx",
    phase: "phase 1",
    kind: "SystemInstanceContextMissing",
    scope: "SystemInstance Create|Update",
    enabled: false,
    fires: 2,
    desc: "Fires when SystemInstance has no Context set. Optional; disable for greenfield ingestion.",
  },
];
</script>

<template>
  <div :style="{ padding: '22px' }">
    <h2 :style="{ fontWeight: 500, letterSpacing: '-0.01em', margin: 0 }">Filter rules</h2>
    <p :style="{ color: 'var(--text-dim)', maxWidth: '640px' }">
      Findings are side-effects of filter functions registered in the <code>eventfilter.Chain</code>. Each rule
      inspects model events and upserts or deletes findings. Finding UUIDs are deterministic (UUID v5 from subject +
      kind) so applying the same event repeatedly produces exactly one finding.
    </p>
    <div :style="{ marginTop: '20px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }">
      <div
        v-for="(rule, i) in RULES"
        :key="rule.id"
        :style="{
          display: 'grid',
          gridTemplateColumns: '44px 200px 220px 1fr 80px 80px',
          gap: '16px',
          padding: '12px 16px',
          alignItems: 'center',
          borderTop: i ? '1px solid var(--border)' : 0,
          background: i % 2 ? 'var(--bg-1)' : 'var(--bg)',
          opacity: rule.enabled ? 1 : 0.55,
        }"
      >
        <div class="toggle" :class="{ on: rule.enabled }" />
        <div>
          <div class="mono" :style="{ fontSize: '12px', color: 'var(--accent)' }">{{ rule.kind }}</div>
          <div class="mono" :style="{ fontSize: '10px', color: 'var(--text-mute)' }">{{ rule.id }}</div>
        </div>
        <div class="mono" :style="{ fontSize: '11px', color: 'var(--text-dim)' }">{{ rule.scope }}</div>
        <div :style="{ fontSize: '12px', color: 'var(--text-dim)' }">{{ rule.desc }}</div>
        <div class="mono" :style="{ fontSize: '11px', color: 'var(--text-mute)' }">{{ rule.phase }}</div>
        <div
          class="mono"
          :style="{
            fontSize: '12px',
            color: rule.fires > 0 ? 'var(--sev-high)' : 'var(--text-mute)',
            textAlign: 'right',
          }"
        >
          ×{{ rule.fires }}
        </div>
      </div>
    </div>
  </div>
</template>
