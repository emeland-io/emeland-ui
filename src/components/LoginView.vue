<script setup lang="ts">
import { computed, ref } from "vue";

import { getRuntimeConfig } from "@/lib/config";
import { useAuth } from "@/lib/auth";

const auth = useAuth();
const config = computed(() => getRuntimeConfig());

const token = ref("");
const submitting = ref(false);
const localError = ref<string | null>(null);

const handleTokenInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  token.value = target.value;
  localError.value = null;
};

const handleOidcClick = async () => {
  await auth.loginWithOidc();
};

const handleRootAdminSubmit = async (e?: Event) => {
  e?.preventDefault();
  if (submitting.value) return;
  submitting.value = true;
  localError.value = null;
  try {
    const ok = await auth.loginWithRootAdmin(token.value);
    if (!ok) localError.value = auth.error.value ?? "Login failed";
  } finally {
    submitting.value = false;
  }
};

const displayError = computed(() => localError.value ?? auth.error.value);
</script>

<template>
  <div class="login-shell">
    <div class="login-card" role="dialog" aria-label="Sign in to EmELand">
      <div class="brand">
        <div class="logo">EL</div>
        <div>
          EmELand <small>observer console</small>
        </div>
      </div>
      <h1>Sign in</h1>
      <p class="hint">
        Authenticate with your identity provider, or use the break-glass root-admin token from the Helm
        release.
      </p>

      <button
        v-if="config.oidc.enabled"
        type="button"
        class="btn primary login-oidc"
        aria-label="Sign in with OIDC"
        @click="handleOidcClick"
      >
        Sign in with OIDC
      </button>
      <div v-else class="notice" role="note">OIDC is disabled in this deployment.</div>

      <div v-if="config.oidc.enabled && config.rootAdmin.enabled" class="separator">
        <span>or</span>
      </div>

      <form v-if="config.rootAdmin.enabled" class="root-admin-form" @submit="handleRootAdminSubmit">
        <label for="root-admin-token" class="root-admin-label">Root-admin token</label>
        <input
          id="root-admin-token"
          type="password"
          autocomplete="current-password"
          aria-label="Root-admin token"
          :value="token"
          placeholder="Paste break-glass token"
          class="root-admin-input"
          @input="handleTokenInput"
        />
        <button
          type="submit"
          class="btn primary"
          :disabled="submitting"
          aria-label="Sign in with root-admin token"
        >
          <template v-if="submitting">Signing in…</template>
          <template v-else>Use root-admin token</template>
        </button>
      </form>

      <div v-if="!config.oidc.enabled && !config.rootAdmin.enabled" class="notice error" role="alert">
        No login methods are configured. Set up OIDC or enable the root-admin token in your deployment
        values.
      </div>

      <div v-if="displayError" class="notice error" role="alert">{{ displayError }}</div>
    </div>
  </div>
</template>
