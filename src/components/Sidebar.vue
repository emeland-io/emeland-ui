<script setup lang="ts">
import type { ActiveView } from "@/lib/types";

import Icon from "./Icon.vue";

export type SidebarCounts = {
  open: number;
  acknowledged: number;
  snoozed: number;
  resolved: number;
};

type IconName =
  | "bell"
  | "check"
  | "snooze"
  | "resolve"
  | "map"
  | "radar"
  | "book"
  | "cog"
  | "filter"
  | "user";

type NavItem = {
  id: ActiveView;
  label: string;
  icon: IconName;
  count?: number;
  requiresAdmin?: boolean;
};

type NavGroup = { group: string; items: NavItem[]; requiresAdmin?: boolean };

type Props = { active: ActiveView; counts: SidebarCounts; isAdmin: boolean };
type Emits = { activate: [view: ActiveView] };

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const nav = (): NavGroup[] => {
  const groups: NavGroup[] = [
    {
      group: "Triage",
      items: [
        { id: "inbox", label: "Alert inbox", icon: "bell", count: props.counts.open },
        { id: "acknowledged", label: "Acknowledged", icon: "check", count: props.counts.acknowledged },
        { id: "snoozed", label: "Snoozed", icon: "snooze", count: props.counts.snoozed },
        { id: "resolved", label: "Resolved", icon: "resolve", count: props.counts.resolved },
      ],
    },
    {
      group: "Landscape",
      items: [
        { id: "explorer", label: "Model explorer", icon: "map" },
        { id: "sensors", label: "Sensors", icon: "radar", count: 4 },
        { id: "classes", label: "Finding classes", icon: "book", count: 6 },
        { id: "rules", label: "Filter rules", icon: "filter", count: 6 },
      ],
    },
    {
      group: "Admin",
      requiresAdmin: true,
      items: [
        { id: "users", label: "Users", icon: "user", requiresAdmin: true },
      ],
    },
    {
      group: "System",
      items: [{ id: "settings", label: "Settings", icon: "cog" }],
    },
  ];
  return groups.filter((group) => !group.requiresAdmin || props.isAdmin);
};

const handleClick = (id: ActiveView) => emit("activate", id);

const handleKeyDown = (e: KeyboardEvent, id: ActiveView) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  emit("activate", id);
};
</script>

<template>
  <aside class="sidebar" aria-label="Primary navigation">
    <template v-for="group in nav()" :key="group.group">
      <div class="group">{{ group.group }}</div>
      <div
        v-for="item in group.items"
        :key="item.id"
        role="button"
        tabindex="0"
        :aria-label="item.label"
        :aria-current="props.active === item.id ? 'page' : undefined"
        class="nav-item"
        :class="{ active: props.active === item.id }"
        @click="handleClick(item.id)"
        @keydown="(e: KeyboardEvent) => handleKeyDown(e, item.id)"
      >
        <Icon :name="item.icon" :size="15" />
        <span>{{ item.label }}</span>
        <span v-if="item.count !== undefined" class="count">{{ item.count }}</span>
      </div>
    </template>
  </aside>
</template>
