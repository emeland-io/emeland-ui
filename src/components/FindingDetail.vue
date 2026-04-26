<script setup lang="ts">
import { computed } from "vue";

import type { Finding, FindingType } from "@/lib/types";
import { severityVar, shortId, timeAgo } from "@/lib/utils";

import Icon from "./Icon.vue";

type Props = {
  finding: Finding | null;
  types: Record<string, FindingType>;
};

const props = defineProps<Props>();

const type = computed(() => (props.finding ? props.types[props.finding.typeKind] : undefined));
const severityColor = computed(() => (type.value ? severityVar(type.value.severity) : undefined));

const isMissing = (displayName?: string) => displayName?.startsWith("(missing") ?? false;

const handleGotoClick = (e: MouseEvent) => e.preventDefault();
</script>

<template>
  <div v-if="!finding" class="empty">
    <div class="glyph"><Icon name="bell" :size="15" /></div>
    <div>Select a finding to view details</div>
  </div>

  <template v-else>
    <div class="detail-header">
      <div class="kind-row">
        <span class="pill">{{ finding.typeKind }}</span>
        <span :style="{ flex: 1 }" />
        <span class="uuid">{{ finding.findingId }}</span>
      </div>
      <h1>{{ finding.summary }}</h1>
      <div :style="{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-dim)', flexWrap: 'wrap' }">
        <span>First seen <code>{{ timeAgo(finding.firstSeen) }}</code></span>
        <span>·</span>
        <span>Last seen <code>{{ timeAgo(finding.lastSeen) }}</code></span>
        <span>·</span>
        <span>Occurrences <code>×{{ finding.count }}</code></span>
        <span>·</span>
        <span>Severity <code :style="{ color: severityColor }">{{ type?.severity }}</code></span>
      </div>
    </div>

    <div class="actions">
      <span :style="{ flex: 1 }" />
      <button type="button" class="btn ghost" aria-label="View API response">
        <span class="mono" :style="{ fontSize: '11px' }">
          GET /landscape/findings/{{ shortId(finding.findingId) }}…
        </span>
        <Icon name="external" />
      </button>
    </div>

    <div class="detail-body">
      <div v-if="finding.description || type?.description" class="section">
        <h3>Description</h3>
        <div class="desc">{{ finding.description || type?.description }}</div>
      </div>

      <div class="section">
        <h3>Finding class</h3>
        <div class="kv-grid">
          <dt>Class</dt>
          <dd>{{ finding.typeKind }}</dd>
          <dt>Class UUID</dt>
          <dd>{{ type?.id }}</dd>
        </div>
      </div>

      <div class="section">
        <h3>Resources in this finding</h3>
        <div
          v-for="(resource, i) in finding.resources"
          :key="resource.resourceId"
          class="resource-card"
          :class="{ missing: isMissing(resource.displayName) }"
        >
          <span class="type-badge">{{ resource.resourceType }}</span>
          <div :style="{ minWidth: 0 }">
            <div class="name">
              <template v-if="i === 0">▸ </template>{{ resource.displayName }}
            </div>
            <div class="uuid">{{ resource.resourceId }}</div>
          </div>
          <a v-if="!isMissing(resource.displayName)" href="#" class="goto" @click="handleGotoClick">
            view <Icon name="external" />
          </a>
        </div>
      </div>

      <div class="section">
        <h3>Annotations</h3>
        <div>
          <span v-for="(a, i) in finding.annotations" :key="`${a.key}-${i}`" class="anno">
            <span class="k">{{ a.key }}</span>
            <span class="v">{{ a.value }}</span>
          </span>
        </div>
      </div>
    </div>
  </template>
</template>
