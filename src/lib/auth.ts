import { User as OidcUser, UserManager, type UserManagerSettings } from "oidc-client-ts";
import { computed, reactive } from "vue";

import { getRuntimeConfig } from "./config";

export type AuthSource = "oidc" | "root-admin";

export type AuthUser = {
  sub: string;
  name: string;
  email?: string;
  roles: string[];
  source: AuthSource;
};

type AuthStatus = "idle" | "signing-in" | "error";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
};

const state = reactive<AuthState>({ user: null, status: "idle", error: null });

let userManager: UserManager | null = null;

type UserManagerFactory = (settings: UserManagerSettings) => UserManager;

// Exposed for tests so they can inject a stub without hitting the real discovery endpoint.
let managerFactory: UserManagerFactory = (settings) => new UserManager(settings);

export const __setUserManagerFactoryForTests = (factory: UserManagerFactory | null): void => {
  managerFactory = factory ?? ((settings) => new UserManager(settings));
  userManager = null;
};

const buildSettings = (): UserManagerSettings => {
  const cfg = getRuntimeConfig();
  return {
    authority: cfg.oidc.authority,
    client_id: cfg.oidc.clientId,
    redirect_uri: cfg.oidc.redirectUri,
    post_logout_redirect_uri: cfg.oidc.postLogoutRedirectUri,
    response_type: "code",
    scope: cfg.oidc.scope,
    loadUserInfo: true,
    automaticSilentRenew: true,
  };
};

const ensureManager = (): UserManager => {
  if (userManager) return userManager;
  userManager = managerFactory(buildSettings());
  return userManager;
};

const roleClaims = (profile: Record<string, unknown>): string[] => {
  const raw = profile.roles ?? profile.groups;
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === "string");
  if (typeof raw === "string") return raw.split(/[\s,]+/).filter(Boolean);
  return [];
};

const toAuthUser = (oidcUser: OidcUser): AuthUser => {
  const profile = oidcUser.profile as Record<string, unknown>;
  const name =
    (profile.name as string | undefined) ??
    (profile.preferred_username as string | undefined) ??
    (profile.email as string | undefined) ??
    "";
  return {
    sub: (profile.sub as string | undefined) ?? "",
    name,
    email: profile.email as string | undefined,
    roles: roleClaims(profile),
    source: "oidc",
  };
};

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const loginWithOidc = async (): Promise<void> => {
  const cfg = getRuntimeConfig();
  if (!cfg.oidc.enabled) {
    state.error = "OIDC login is disabled by configuration";
    state.status = "error";
    return;
  }
  state.status = "signing-in";
  state.error = null;
  try {
    await ensureManager().signinRedirect();
  } catch (err) {
    state.status = "error";
    state.error = err instanceof Error ? err.message : String(err);
  }
};

const handleCallback = async (): Promise<void> => {
  const cfg = getRuntimeConfig();
  if (!cfg.oidc.enabled) return;
  try {
    const oidcUser = await ensureManager().signinRedirectCallback();
    state.user = toAuthUser(oidcUser);
    state.status = "idle";
    state.error = null;
  } catch (err) {
    state.status = "error";
    state.error = err instanceof Error ? err.message : String(err);
  } finally {
    // Strip the code/state from the URL so a refresh doesn't retry the exchange.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
};

const loginWithRootAdmin = async (token: string): Promise<boolean> => {
  const cfg = getRuntimeConfig();
  if (!cfg.rootAdmin.enabled) {
    state.error = "Root-admin login is disabled";
    return false;
  }
  if (!token.trim()) {
    state.error = "Enter a token";
    return false;
  }
  const hash = await sha256Hex(token);
  if (hash.toLowerCase() !== cfg.rootAdmin.tokenSha256.toLowerCase()) {
    state.error = "Invalid root-admin token";
    return false;
  }
  state.user = {
    sub: "root-admin",
    name: "Root Admin",
    roles: ["admin"],
    source: "root-admin",
  };
  state.status = "idle";
  state.error = null;
  return true;
};

const logout = async (): Promise<void> => {
  const wasOidc = state.user?.source === "oidc";
  state.user = null;
  state.status = "idle";
  state.error = null;
  if (!wasOidc) return;
  try {
    await ensureManager().signoutRedirect();
  } catch {
    // Best effort — local state is already cleared.
  }
};

const init = async (): Promise<void> => {
  const cfg = getRuntimeConfig();
  if (typeof window !== "undefined" && window.location.search.includes("code=")) {
    await handleCallback();
    return;
  }
  if (!cfg.oidc.enabled) return;
  try {
    const existing = await ensureManager().getUser();
    if (existing && !existing.expired) state.user = toAuthUser(existing);
  } catch {
    // silent — user simply isn't signed in
  }
};

export const resetAuthStateForTests = (): void => {
  state.user = null;
  state.status = "idle";
  state.error = null;
  userManager = null;
};

export const __setUserForTests = (user: AuthUser | null): void => {
  state.user = user;
  state.status = "idle";
  state.error = null;
};

export const useAuth = () => ({
  user: computed(() => state.user),
  status: computed(() => state.status),
  error: computed(() => state.error),
  isAuthenticated: computed(() => state.user !== null),
  isAdmin: computed(() => state.user?.roles.includes("admin") ?? false),
  loginWithOidc,
  loginWithRootAdmin,
  handleCallback,
  logout,
  init,
});
