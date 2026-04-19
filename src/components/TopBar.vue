<script setup lang="ts">
import { computed } from "vue";

import type { AuthUser } from "@/lib/auth";

import Icon from "./Icon.vue";

type Props = { query: string; user: AuthUser | null };
type Emits = {
  "update:query": [value: string];
  "sign-out": [];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:query", target.value);
};

const handleSignOut = () => emit("sign-out");

const initials = computed(() => {
  const name = props.user?.name ?? "";
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

const primaryRole = computed(() => props.user?.roles[0] ?? null);
</script>

<template>
  <div class="topbar">
    <div class="brand">
      <div class="logo">EL</div>
      <div>
        EmELand <small>observer console</small>
      </div>
    </div>
    <span :style="{ width: '20px' }" />
    <div class="env">
      <span class="dot" />
      modelsrv · emeland.local/v1
    </div>
    <div class="spacer" />
    <div class="search">
      <Icon name="search" />
      <input
        :value="query"
        placeholder="Search findings, resources, UUIDs… (⌘K)"
        aria-label="Search findings"
        @input="handleInput"
      />
      <span class="kbd">⌘K</span>
    </div>
    <div v-if="user" class="user-menu" aria-label="Current user">
      <div class="avatar" :aria-label="`Signed in as ${user.name}`">{{ initials }}</div>
      <div>
        <div class="user-name">{{ user.name }}</div>
        <span v-if="primaryRole" class="role-chip" :aria-label="`Role ${primaryRole}`">{{ primaryRole }}</span>
      </div>
      <button type="button" class="signout" aria-label="Sign out" @click="handleSignOut">Sign out</button>
    </div>
  </div>
</template>
