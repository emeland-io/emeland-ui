import { describe, expect, it, vi } from "vitest";

import {
  __setUserManagerFactoryForTests,
  resetAuthStateForTests,
  useAuth,
} from "@/lib/auth";
import { setRuntimeConfigForTests } from "@/lib/config";

// SHA-256 of "correct horse battery staple"
const KNOWN_TOKEN = "correct horse battery staple";
const KNOWN_HASH = "c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a";

const configureRootAdmin = (hash = KNOWN_HASH) =>
  setRuntimeConfigForTests({
    oidc: {
      enabled: false,
      authority: "",
      clientId: "emeland-ui",
      scope: "openid profile email",
      redirectUri: "http://localhost/oidc/callback",
      postLogoutRedirectUri: "http://localhost",
    },
    rootAdmin: { enabled: true, tokenSha256: hash },
    api: { baseUrl: "http://localhost:8080" },
  });

describe("useAuth — root admin", () => {
  it("signs in with a valid root-admin token", async () => {
    configureRootAdmin();
    const auth = useAuth();

    const ok = await auth.loginWithRootAdmin(KNOWN_TOKEN);

    expect(ok).toBe(true);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.user.value?.source).toBe("root-admin");
    expect(auth.isAdmin.value).toBe(true);
    expect(auth.user.value?.name).toBe("Root Admin");
  });

  it("rejects an incorrect token with an error message", async () => {
    configureRootAdmin();
    const auth = useAuth();

    const ok = await auth.loginWithRootAdmin("nope");

    expect(ok).toBe(false);
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.error.value).toMatch(/invalid/i);
  });

  it("refuses empty input before hashing", async () => {
    configureRootAdmin();
    const auth = useAuth();

    const ok = await auth.loginWithRootAdmin("   ");

    expect(ok).toBe(false);
    expect(auth.error.value).toMatch(/enter a token/i);
  });

  it("refuses login when root-admin is disabled", async () => {
    setRuntimeConfigForTests({
      oidc: {
        enabled: false,
        authority: "",
        clientId: "emeland-ui",
        scope: "openid profile email",
        redirectUri: "http://localhost/oidc/callback",
        postLogoutRedirectUri: "http://localhost",
      },
      rootAdmin: { enabled: false, tokenSha256: "" },
      api: { baseUrl: "http://localhost:8080" },
    });
    const auth = useAuth();

    const ok = await auth.loginWithRootAdmin(KNOWN_TOKEN);

    expect(ok).toBe(false);
    expect(auth.error.value).toMatch(/disabled/i);
  });

  it("clears state on logout", async () => {
    configureRootAdmin();
    const auth = useAuth();
    await auth.loginWithRootAdmin(KNOWN_TOKEN);
    expect(auth.isAuthenticated.value).toBe(true);

    await auth.logout();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.user.value).toBeNull();
  });
});

describe("useAuth — OIDC", () => {
  it("short-circuits loginWithOidc when OIDC is disabled", async () => {
    setRuntimeConfigForTests({
      oidc: {
        enabled: false,
        authority: "",
        clientId: "emeland-ui",
        scope: "openid profile email",
        redirectUri: "http://localhost/oidc/callback",
        postLogoutRedirectUri: "http://localhost",
      },
      rootAdmin: { enabled: true, tokenSha256: KNOWN_HASH },
      api: { baseUrl: "http://localhost:8080" },
    });
    const auth = useAuth();

    await auth.loginWithOidc();

    expect(auth.status.value).toBe("error");
    expect(auth.error.value).toMatch(/disabled/i);
  });

  it("delegates signinRedirect to the UserManager when OIDC is enabled", async () => {
    setRuntimeConfigForTests({
      oidc: {
        enabled: true,
        authority: "https://auth.example.com",
        clientId: "emeland-ui",
        scope: "openid profile email",
        redirectUri: "http://localhost/oidc/callback",
        postLogoutRedirectUri: "http://localhost",
      },
      rootAdmin: { enabled: true, tokenSha256: KNOWN_HASH },
      api: { baseUrl: "http://localhost:8080" },
    });
    const signinRedirect = vi.fn().mockResolvedValue(undefined);
    __setUserManagerFactoryForTests(() => ({ signinRedirect } as unknown as InstanceType<typeof import("oidc-client-ts").UserManager>));
    resetAuthStateForTests();
    const auth = useAuth();

    await auth.loginWithOidc();

    expect(signinRedirect).toHaveBeenCalledOnce();

    __setUserManagerFactoryForTests(null);
  });
});
