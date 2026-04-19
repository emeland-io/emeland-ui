export type RuntimeConfig = {
  oidc: {
    enabled: boolean;
    authority: string;
    clientId: string;
    scope: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
  };
  rootAdmin: {
    enabled: boolean;
    // Hex-encoded SHA-256 of the root-admin token. The raw token lives in a
    // Kubernetes Secret and is never exposed to the browser.
    tokenSha256: string;
  };
  api: {
    baseUrl: string;
  };
};

declare global {
  interface Window {
    EMELAND_UI_CONFIG?: Partial<RuntimeConfig>;
  }
}

const DEFAULT_CONFIG: RuntimeConfig = {
  oidc: {
    enabled: false,
    authority: "",
    clientId: "emeland-ui",
    scope: "openid profile email",
    redirectUri: "",
    postLogoutRedirectUri: "",
  },
  rootAdmin: {
    enabled: true,
    // Dev-only default. The SHA-256 below is for the literal string "dev-root-admin".
    // Helm overrides this at deploy time with the hash of the auto-generated token.
    tokenSha256: "1917fd799bc758930885698fed25fca26bfc5f6bf550641a8dedeb6c63fb97ca",
  },
  api: {
    baseUrl: "http://localhost:8080",
  },
};

let cached: RuntimeConfig | null = null;

const fallbackOrigin = (): string => {
  if (typeof window === "undefined") return "http://localhost:5173";
  return window.location.origin;
};

const merge = (partial: Partial<RuntimeConfig> | undefined): RuntimeConfig => {
  const origin = fallbackOrigin();
  const defaults: RuntimeConfig = {
    ...DEFAULT_CONFIG,
    oidc: {
      ...DEFAULT_CONFIG.oidc,
      redirectUri: `${origin}/oidc/callback`,
      postLogoutRedirectUri: origin,
    },
  };
  if (!partial) return defaults;
  return {
    oidc: { ...defaults.oidc, ...(partial.oidc ?? {}) },
    rootAdmin: { ...defaults.rootAdmin, ...(partial.rootAdmin ?? {}) },
    api: { ...defaults.api, ...(partial.api ?? {}) },
  };
};

export const getRuntimeConfig = (): RuntimeConfig => {
  if (cached) return cached;
  const partial = typeof window === "undefined" ? undefined : window.EMELAND_UI_CONFIG;
  cached = merge(partial);
  return cached;
};

export const resetRuntimeConfigForTests = (): void => {
  cached = null;
  if (typeof window !== "undefined") delete window.EMELAND_UI_CONFIG;
};

export const setRuntimeConfigForTests = (config: Partial<RuntimeConfig>): RuntimeConfig => {
  cached = merge(config);
  if (typeof window !== "undefined") window.EMELAND_UI_CONFIG = config;
  return cached;
};
