import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import LoginView from "@/components/LoginView.vue";
import { useAuth } from "@/lib/auth";
import { setRuntimeConfigForTests } from "@/lib/config";

const KNOWN_TOKEN = "correct horse battery staple";
const KNOWN_HASH = "c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a";

const configureRootAdmin = () =>
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

const flush = async () => {
  // SHA-256 digest uses subtle.crypto which schedules microtasks; yielding a
  // macrotask plus a couple of Vue ticks gives the promise chain time to settle
  // before we assert on the rendered state.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  await nextTick();
};

describe("LoginView", () => {
  it("authenticates with a valid root-admin token", async () => {
    configureRootAdmin();
    const auth = useAuth();
    const wrapper = mount(LoginView);
    await flush();

    expect(wrapper.find('[aria-label="Sign in with OIDC"]').exists()).toBe(false);

    const input = wrapper.find('input[aria-label="Root-admin token"]');
    await input.setValue(KNOWN_TOKEN);
    await wrapper.find("form.root-admin-form").trigger("submit");
    await flush();

    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isAdmin.value).toBe(true);
  });

  it("shows an error when the token is wrong", async () => {
    configureRootAdmin();
    const wrapper = mount(LoginView);
    await flush();

    await wrapper.find('input[aria-label="Root-admin token"]').setValue("not-it");
    await wrapper.find("form.root-admin-form").trigger("submit");
    await flush();

    expect(wrapper.text().toLowerCase()).toContain("invalid");
  });

  it("renders the OIDC button when OIDC is enabled", () => {
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
    const wrapper = mount(LoginView);
    expect(wrapper.find('[aria-label="Sign in with OIDC"]').exists()).toBe(true);
  });

  it("warns when no auth methods are configured", () => {
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
    const wrapper = mount(LoginView);
    expect(wrapper.find('[role="alert"]').text()).toMatch(/no login methods/i);
  });
});
