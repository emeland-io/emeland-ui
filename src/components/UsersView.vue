<script setup lang="ts">
import { ref } from "vue";

import type { ManagedUser, UserRole } from "@/lib/types";
import { useUsers } from "@/lib/users";

const { users, add, update, remove, toggleStatus } = useUsers();

const name = ref("");
const email = ref("");
const role = ref<UserRole>("observer");
const error = ref<string | null>(null);

const handleNameInput = (e: Event) => {
  name.value = (e.target as HTMLInputElement).value;
};

const handleEmailInput = (e: Event) => {
  email.value = (e.target as HTMLInputElement).value;
};

const handleRoleInput = (e: Event) => {
  role.value = (e.target as HTMLSelectElement).value as UserRole;
};

const handleSubmit = (e: Event) => {
  e.preventDefault();
  error.value = null;
  const trimmedName = name.value.trim();
  const trimmedEmail = email.value.trim();
  if (!trimmedName || !trimmedEmail) {
    error.value = "Name and email are required";
    return;
  }
  if (!/.+@.+\..+/.test(trimmedEmail)) {
    error.value = "Invalid email address";
    return;
  }
  add({ name: trimmedName, email: trimmedEmail, role: role.value });
  name.value = "";
  email.value = "";
  role.value = "observer";
};

const handleRoleChange = (user: ManagedUser, e: Event) => {
  const next = (e.target as HTMLSelectElement).value as UserRole;
  update(user.id, { role: next });
};

const handleToggle = (user: ManagedUser) => toggleStatus(user.id);

const handleRemove = (user: ManagedUser) => {
  if (!confirm(`Remove ${user.name}?`)) return;
  remove(user.id);
};
</script>

<template>
  <div class="users-view">
    <header>
      <h2>Users</h2>
      <span class="grow" />
      <span class="mono" :style="{ fontSize: '12px', color: 'var(--text-mute)' }">{{ users.list.length }} users</span>
    </header>
    <p :style="{ color: 'var(--text-dim)', margin: 0, maxWidth: '600px' }">
      Manage operator access to the console. Admin roles see this view and manage root-admin recovery; observers
      triage findings; viewers have read-only access.
    </p>

    <form class="user-form" aria-label="Add user" @submit="handleSubmit">
      <div class="field">
        <label for="new-user-name">Name</label>
        <input id="new-user-name" type="text" :value="name" placeholder="Full name" @input="handleNameInput" />
      </div>
      <div class="field">
        <label for="new-user-email">Email</label>
        <input id="new-user-email" type="email" :value="email" placeholder="user@example.com" @input="handleEmailInput" />
      </div>
      <div class="field">
        <label for="new-user-role">Role</label>
        <select id="new-user-role" :value="role" @change="handleRoleInput">
          <option value="admin">admin</option>
          <option value="observer">observer</option>
          <option value="viewer">viewer</option>
        </select>
      </div>
      <div class="field">
        <label>&nbsp;</label>
        <button type="submit" class="btn primary" aria-label="Add user">Add user</button>
      </div>
      <div v-if="error" class="notice error" role="alert" :style="{ gridColumn: '1 / -1' }">{{ error }}</div>
    </form>

    <div class="users-table" role="table" aria-label="Users">
      <div class="row-header" role="row">
        <div role="columnheader">Name</div>
        <div role="columnheader">Email</div>
        <div role="columnheader">Role</div>
        <div role="columnheader">Status</div>
        <div role="columnheader" :style="{ textAlign: 'right' }">Actions</div>
      </div>
      <div
        v-for="user in users.list"
        :key="user.id"
        class="user-row"
        role="row"
        :data-user-id="user.id"
      >
        <div class="name" role="cell">{{ user.name }}</div>
        <div class="email" role="cell">{{ user.email }}</div>
        <div role="cell">
          <select
            :value="user.role"
            :aria-label="`Change role for ${user.name}`"
            @change="(e: Event) => handleRoleChange(user, e)"
          >
            <option value="admin">admin</option>
            <option value="observer">observer</option>
            <option value="viewer">viewer</option>
          </select>
        </div>
        <div role="cell">
          <span class="status-dot" :class="user.status" />
          {{ user.status }}
        </div>
        <div class="row-actions" role="cell">
          <button
            type="button"
            class="btn ghost"
            :aria-label="user.status === 'active' ? `Disable ${user.name}` : `Enable ${user.name}`"
            @click="handleToggle(user)"
          >
            {{ user.status === "active" ? "Disable" : "Enable" }}
          </button>
          <button
            type="button"
            class="btn danger"
            :aria-label="`Remove ${user.name}`"
            @click="handleRemove(user)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
