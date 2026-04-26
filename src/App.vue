<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import ClassesView from "./components/ClassesView.vue";
import FindingDetail from "./components/FindingDetail.vue";
import FindingRow from "./components/FindingRow.vue";
import Icon from "./components/Icon.vue";
import LoginView from "./components/LoginView.vue";
import ModelExplorerView from "./components/ModelExplorerView.vue";
import NodeGraphView from "./components/NodeGraphView.vue";
import RulesView from "./components/RulesView.vue";
import SensorsView from "./components/SensorsView.vue";
import Sidebar, { type SidebarCounts } from "./components/Sidebar.vue";
import TopBar from "./components/TopBar.vue";
import TweaksPanel from "./components/TweaksPanel.vue";
import UsersView from "./components/UsersView.vue";

import { useAuth } from "./lib/auth";
import { CONTEXTS, FINDING_TYPES, FINDINGS, SENSORS } from "./lib/data";
import type { ActiveView, Finding, Severity, Tweaks } from "./lib/types";
import { TWEAK_DEFAULTS, severityOf } from "./lib/utils";

const TWEAKS_STORAGE_KEY = "emeland_tweaks";

type FilterState = {
  severity: Severity | null;
  sensor: string | null;
  context: string | null;
  kind: string | null;
};

type Group = { label: string | null; items: Finding[] };

const auth = useAuth();

const active = ref<ActiveView>("findings");
const selectedId = ref<string>(FINDINGS[0].findingId);
const query = ref("");
const filters = reactive<FilterState>({ severity: null, sensor: null, context: null, kind: null });
const tweaks = reactive<Tweaks>({ ...TWEAK_DEFAULTS });
const tweaksHydrated = ref(false);
const tweaksVisible = ref(false);

onMounted(async () => {
  try {
    const raw = window.localStorage.getItem(TWEAKS_STORAGE_KEY);
    if (raw) Object.assign(tweaks, { ...TWEAK_DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>) });
  } catch {
    // keep defaults
  }
  tweaksHydrated.value = true;
  await auth.init();
});

watch(
  () => ({ ...tweaks }),
  (next) => {
    if (!tweaksHydrated.value) return;
    document.documentElement.dataset.theme = next.theme;
    try {
      window.localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — safe to ignore
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => auth.isAdmin.value,
  (isAdmin) => {
    if (!isAdmin && active.value === "users") active.value = "findings";
  }
);

const counts = computed<SidebarCounts>(() => ({ findings: FINDINGS.length }));

const filtered = computed<Finding[]>(() => {
  let list = FINDINGS;
  if (filters.severity) list = list.filter((f) => severityOf(f, FINDING_TYPES) === filters.severity);
  if (filters.sensor) list = list.filter((f) => f.sensor === filters.sensor);
  if (filters.context) list = list.filter((f) => f.contextId === filters.context);
  if (filters.kind) list = list.filter((f) => f.typeKind === filters.kind);
  if (query.value) {
    const q = query.value.toLowerCase();
    list = list.filter(
      (f) =>
        f.summary.toLowerCase().includes(q) ||
        f.typeKind.toLowerCase().includes(q) ||
        f.findingId.startsWith(q) ||
        f.resources.some((r) => r.displayName?.toLowerCase().includes(q))
    );
  }
  return [...list].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
});

const selected = computed<Finding | null>(
  () => filtered.value.find((f) => f.findingId === selectedId.value) ?? filtered.value[0] ?? null
);

watch(filtered, (list) => {
  if (list.length && !list.find((f) => f.findingId === selectedId.value)) {
    selectedId.value = list[0].findingId;
  }
});

const grouped = computed<Group[]>(() => {
  if (tweaks.groupBy === "none") return [{ label: null, items: filtered.value }];
  const map = new Map<string, Finding[]>();
  for (const finding of filtered.value) {
    let label = "";
    if (tweaks.groupBy === "kind") label = finding.typeKind;
    else if (tweaks.groupBy === "context") label = CONTEXTS[finding.contextId]?.displayName ?? "Unscoped";
    else if (tweaks.groupBy === "sensor") label = finding.sensor;
    const list = map.get(label);
    if (list) list.push(finding);
    else map.set(label, [finding]);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
});

const handleToggleTweaks = () => {
  tweaksVisible.value = !tweaksVisible.value;
};

const handleCloseTweaks = () => {
  tweaksVisible.value = false;
};

const handleUpdateTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
  tweaks[key] = value;
};

const handleToggleSeverity = (severity: Severity) => {
  filters.severity = filters.severity === severity ? null : severity;
};

const handleToggleSensor = (sensorId: string) => {
  filters.sensor = filters.sensor === sensorId ? null : sensorId;
};

const handleChipKeyDown = (e: KeyboardEvent, fn: () => void) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  fn();
};

const handleSelectFinding = (findingId: string) => {
  selectedId.value = findingId;
};

const handleQueryUpdate = (value: string) => {
  query.value = value;
};

const handleSearchMiniInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  query.value = target.value;
};

const handleActivateView = (view: ActiveView) => {
  if (view === "users" && !auth.isAdmin.value) return;
  active.value = view;
};

const handleSignOut = async () => {
  await auth.logout();
};

const sensors = Object.values(SENSORS);
const severities: Severity[] = ["high", "medium", "low"];

const severityDotColor = (severity: Severity) =>
  severity === "medium" ? "var(--sev-med)" : severity === "high" ? "var(--sev-high)" : "var(--sev-low)";
</script>

<template>
  <LoginView v-if="!auth.isAuthenticated.value" />
  <div v-else class="app" :class="{ dense: tweaks.density === 'dense' }">
    <TopBar
      :query="query"
      :user="auth.user.value"
      @update:query="handleQueryUpdate"
      @sign-out="handleSignOut"
    />
    <Sidebar
      :active="active"
      :counts="counts"
      :is-admin="auth.isAdmin.value"
      @activate="handleActivateView"
    />

    <div v-if="active === 'findings'" class="main" :class="{ 'full-detail': tweaks.layout === 'full-detail' }">
      <div class="list-pane">
        <div class="filters">
          <div
            v-for="s in severities"
            :key="s"
            role="button"
            tabindex="0"
            :aria-pressed="filters.severity === s"
            :aria-label="`severity ${s}`"
            class="chip"
            :class="{ active: filters.severity === s }"
            @click="handleToggleSeverity(s)"
            @keydown="(e: KeyboardEvent) => handleChipKeyDown(e, () => handleToggleSeverity(s))"
          >
            <span
              :style="{
                width: '6px',
                height: '6px',
                borderRadius: '3px',
                background: severityDotColor(s),
              }"
            />
            {{ s }}
          </div>
          <span class="divider" />
          <div
            v-for="sensor in sensors"
            :key="sensor.id"
            role="button"
            tabindex="0"
            :aria-pressed="filters.sensor === sensor.id"
            :aria-label="`sensor ${sensor.id}`"
            class="chip"
            :class="{ active: filters.sensor === sensor.id }"
            @click="handleToggleSensor(sensor.id)"
            @keydown="(e: KeyboardEvent) => handleChipKeyDown(e, () => handleToggleSensor(sensor.id))"
          >
            <span class="mono">{{ sensor.id }}</span>
          </div>
          <span class="divider" />
          <div class="search-mini">
            <Icon name="search" />
            <input
              :value="query"
              placeholder="filter findings…"
              aria-label="Filter findings"
              @input="handleSearchMiniInput"
            />
          </div>
          <button
            type="button"
            class="btn ghost"
            aria-label="Toggle tweaks panel"
            :style="{ marginLeft: 'auto' }"
            @click="handleToggleTweaks"
          >
            <Icon name="cog" />
          </button>
        </div>

        <div class="finding-list">
          <div v-if="filtered.length === 0" class="empty">
            <div class="glyph"><Icon name="check" /></div>
            <div>No findings match.</div>
          </div>
          <template v-for="(group, gi) in grouped" :key="group.label ?? `g-${gi}`">
            <div v-if="group.label" class="group-header">
              {{ group.label }} <span class="count">×{{ group.items.length }}</span>
            </div>
            <FindingRow
              v-for="finding in group.items"
              :key="finding.findingId"
              :finding="finding"
              :types="FINDING_TYPES"
              :selected="finding.findingId === selected?.findingId"
              @select="handleSelectFinding"
            />
          </template>
        </div>
      </div>

      <div class="detail-pane">
        <FindingDetail :finding="selected" :types="FINDING_TYPES" />
      </div>
    </div>

    <div v-else :style="{ overflow: 'auto' }">
      <SensorsView v-if="active === 'sensors'" />
      <ModelExplorerView v-else-if="active === 'explorer'" />
      <NodeGraphView v-else-if="active === 'graph'" />
      <ClassesView v-else-if="active === 'classes'" />
      <RulesView v-else-if="active === 'rules'" />
      <UsersView v-else-if="active === 'users' && auth.isAdmin.value" />
      <div v-else-if="active === 'settings'" class="empty">
        Settings — API server URL, auth, notifications
      </div>
    </div>

    <TweaksPanel
      v-if="tweaksVisible"
      :tweaks="tweaks"
      @update:tweak="handleUpdateTweak"
      @close="handleCloseTweaks"
    />
  </div>
</template>
