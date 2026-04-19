<script setup lang="ts">
import { computed, ref } from "vue";

import type { DetailAction, Finding, FindingType, LocalState } from "@/lib/types";
import { severityVar, shortId, timeAgo } from "@/lib/utils";

import Icon from "./Icon.vue";

type Props = {
  finding: Finding | null;
  types: Record<string, FindingType>;
  localState: LocalState;
};

type Emits = {
  action: [action: DetailAction, finding: Finding, payload?: string];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const noteText = ref("");

type TimelineEvent = {
  kind: string;
  t: string;
  who?: string;
  body: string;
  extra?: string;
};

const type = computed(() => (props.finding ? props.types[props.finding.typeKind] : undefined));
const severityColor = computed(() => (type.value ? severityVar(type.value.severity) : undefined));

const timeline = computed<TimelineEvent[]>(() => {
  const finding = props.finding;
  if (!finding) return [];
  const localNotes = props.localState.notes[finding.findingId] ?? [];
  const items: TimelineEvent[] = [
    {
      kind: "evt-detect",
      t: finding.firstSeen,
      body: "Finding first detected by",
      who: finding.sensor,
    },
  ];
  if (finding.state === "acknowledged" && finding.ackedAt) {
    items.push({
      kind: "evt-ack",
      t: finding.ackedAt,
      body: "Acknowledged by",
      who: finding.ackedBy,
    });
  }
  if (finding.state === "snoozed" && finding.snoozedUntil) {
    items.push({
      kind: "evt-snooze",
      t: finding.lastSeen,
      body: "Snoozed by",
      who: finding.snoozedBy,
      extra: `until ${new Date(finding.snoozedUntil).toLocaleTimeString()}`,
    });
  }
  for (const note of localNotes) {
    items.push({
      kind: "evt-comment",
      t: note.at,
      body: "commented",
      who: note.by,
      extra: note.text,
    });
  }
  if (finding.state === "resolved" && finding.resolvedAt) {
    items.push({
      kind: "evt-resolve",
      t: finding.resolvedAt,
      body: "Resolved",
      extra: finding.resolvedReason,
    });
  }
  items.push({
    kind: "",
    t: finding.lastSeen,
    body: "Last occurrence — count now",
    who: `×${finding.count}`,
  });
  return items.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
});

const handleAction = (action: DetailAction) => {
  if (!props.finding) return;
  emit("action", action, props.finding);
};

const handlePostNote = () => {
  if (!props.finding) return;
  const trimmed = noteText.value.trim();
  if (!trimmed) return;
  emit("action", "comment", props.finding, trimmed);
  noteText.value = "";
};

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
        <span class="state-badge" :class="finding.state">{{ finding.state }}</span>
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
      <button
        v-if="finding.state !== 'resolved' && finding.state !== 'acknowledged'"
        type="button"
        class="btn primary"
        @click="handleAction('ack')"
      >
        <Icon name="check" /> Acknowledge
      </button>
      <button
        v-if="finding.state !== 'snoozed' && finding.state !== 'resolved'"
        type="button"
        class="btn"
        @click="handleAction('snooze')"
      >
        <Icon name="snooze" /> Snooze 4h
      </button>
      <button type="button" class="btn" @click="handleAction('assign')">
        <Icon name="user" /> Assign…
      </button>
      <button v-if="finding.state === 'acknowledged'" type="button" class="btn" @click="handleAction('reopen')">
        Re-open
      </button>
      <button v-if="finding.state !== 'resolved'" type="button" class="btn" @click="handleAction('resolveModal')">
        <Icon name="resolve" /> Resolve…
      </button>
      <button type="button" class="btn" @click="handleAction('link')">
        <Icon name="external" /> Link ticket
      </button>
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
          <dt>Phase</dt>
          <dd>phase 0 · structural integrity</dd>
          <dt>Auto-resolves</dt>
          <dd>yes — when referenced resource is registered</dd>
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

      <div class="section">
        <h3>Activity</h3>
        <div class="timeline">
          <div v-for="(event, i) in timeline" :key="i" class="event" :class="event.kind">
            <div class="t">{{ timeAgo(event.t) }}</div>
            <div class="dot-col"><span class="dot" /></div>
            <div class="msg">
              {{ event.body }}<template v-if="event.who"> <span class="who">{{ event.who }}</span></template
              ><template v-if="event.extra && event.kind !== 'evt-comment' && event.kind !== 'evt-resolve'">
                {{ event.extra }}</template>
              <small v-if="event.extra && (event.kind === 'evt-comment' || event.kind === 'evt-resolve')">{{ event.extra }}</small>
            </div>
          </div>
        </div>
        <div class="composer">
          <textarea
            v-model="noteText"
            placeholder="Add a note… e.g. asked @maya to push the missing API manifest"
            aria-label="Add note"
          />
          <div class="composer-actions">
            <button type="button" class="btn ghost">Attach link</button>
            <button type="button" class="btn primary" @click="handlePostNote">
              <Icon name="comment" /> Post note
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
