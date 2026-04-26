import { beforeEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

import App from "@/App.vue";
import { __setUserForTests } from "@/lib/auth";

const signInAsObserver = () =>
  __setUserForTests({
    sub: "observer-1",
    name: "Observer One",
    roles: ["observer"],
    source: "oidc",
  });

const signInAsAdmin = () =>
  __setUserForTests({
    sub: "root-admin",
    name: "Root Admin",
    roles: ["admin"],
    source: "root-admin",
  });

const firstOpenFinding = 'Context "checkout-eu" has no ContextType set';

const mountApp = () => mount(App, { attachTo: document.body });

const flush = async () => {
  await nextTick();
  await nextTick();
};

const listRows = (wrapper: VueWrapper) => wrapper.findAll(".finding-list .row");
const rowTexts = (wrapper: VueWrapper) => listRows(wrapper).map((row) => row.text());

const navItemFor = (wrapper: VueWrapper, label: RegExp) =>
  wrapper.findAll(".sidebar .nav-item").find((item) => label.test(item.attributes("aria-label") ?? ""));

const activateNav = async (wrapper: VueWrapper, label: RegExp) => {
  const item = navItemFor(wrapper, label);
  if (!item) throw new Error(`nav item not found for ${label}`);
  await item.trigger("click");
  await flush();
};

const chipFor = (wrapper: VueWrapper, ariaLabel: string) =>
  wrapper.findAll(".filters .chip").find((chip) => chip.attributes("aria-label") === ariaLabel);

describe("Observer Console — findings list", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAsObserver();
  });

  it("renders the findings list by default with all findings", async () => {
    const wrapper = mountApp();
    await flush();
    const texts = rowTexts(wrapper);
    expect(texts.some((t) => t.includes(firstOpenFinding))).toBe(true);
    expect(listRows(wrapper).length).toBe(11);
  });

  it("sidebar shows the total finding count and no triage tabs", async () => {
    const wrapper = mountApp();
    await flush();
    expect(navItemFor(wrapper, /^findings$/i)?.find(".count").text()).toBe("11");
    expect(navItemFor(wrapper, /^acknowledged$/i)).toBeUndefined();
    expect(navItemFor(wrapper, /^snoozed$/i)).toBeUndefined();
    expect(navItemFor(wrapper, /^resolved$/i)).toBeUndefined();
  });

  it("renders the Sensors view when activated", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /sensors/i);
    expect(wrapper.text()).toContain("git-main");
    expect(wrapper.findAll(".finding-list").length).toBe(0);
  });

  it("renders the Filter rules view when activated", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /filter rules/i);
    expect(wrapper.text()).toContain("Filter rules");
    expect(wrapper.text()).toContain("eventfilter.Chain");
  });
});

describe("Observer Console — filtering", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAsObserver();
  });

  it("filters findings by severity chip", async () => {
    const wrapper = mountApp();
    await flush();
    await chipFor(wrapper, "severity low")?.trigger("click");
    await flush();
    const texts = rowTexts(wrapper);
    expect(texts.some((t) => t.includes("orders-prod"))).toBe(true);
    expect(texts.some((t) => t.includes(firstOpenFinding))).toBe(false);
  });

  it("filters findings by sensor chip", async () => {
    const wrapper = mountApp();
    await flush();
    await chipFor(wrapper, "sensor k8s-us")?.trigger("click");
    await flush();
    const texts = rowTexts(wrapper);
    expect(texts.every((t) => t.includes("k8s-us"))).toBe(true);
  });

  it("filters findings by free-text search", async () => {
    const wrapper = mountApp();
    await flush();
    const miniSearch = wrapper.find('.filters .search-mini input');
    await miniSearch.setValue("checkout-eu");
    await flush();
    const texts = rowTexts(wrapper);
    expect(texts.length).toBe(1);
    expect(texts[0]).toContain(firstOpenFinding);
  });
});

describe("Observer Console — finding detail", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAsObserver();
  });

  it("selects a finding and shows its detail", async () => {
    const wrapper = mountApp();
    await flush();
    const row = listRows(wrapper).find((r) => r.text().includes(firstOpenFinding));
    await row?.trigger("click");
    await flush();
    const heading = wrapper.find(".detail-header h1");
    expect(heading.text()).toBe(firstOpenFinding);
  });

  it("does not render triage actions on the detail pane", async () => {
    const wrapper = mountApp();
    await flush();
    const detailButtons = wrapper.findAll(".detail-pane .actions .btn").map((b) => b.text());
    for (const text of detailButtons) {
      expect(text).not.toMatch(/acknowledge|snooze|resolve|assign|link ticket/i);
    }
    expect(wrapper.find(".composer").exists()).toBe(false);
  });
});

describe("Observer Console — model explorer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAsObserver();
  });

  it("renders resource types in the left rail when activated", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /model explorer/i);
    const types = wrapper.findAll(".explorer-types .explorer-type");
    const labels = types.map((t) => t.attributes("aria-label"));
    expect(labels).toContain("type Context");
    expect(labels).toContain("type Node");
    expect(labels).toContain("type NodeType");
  });

  it("filters the resource list when typing in the search input", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /model explorer/i);
    // Switch to Component type so we have multiple to filter.
    const componentType = wrapper
      .findAll(".explorer-types .explorer-type")
      .find((t) => t.attributes("aria-label") === "type Component");
    await componentType?.trigger("click");
    await flush();
    const search = wrapper.find(".explorer-search input");
    await search.setValue("checkout");
    await flush();
    const visible = wrapper.findAll(".explorer-resource").map((r) => r.attributes("aria-label"));
    expect(visible).toContain("resource checkout-worker");
    expect(visible).not.toContain("resource ml-trainer");
  });

  it("navigates to a related resource when clicking a relation", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /model explorer/i);
    // Default selection is the first Context — pick checkout-worker via Component type instead.
    const componentType = wrapper
      .findAll(".explorer-types .explorer-type")
      .find((t) => t.attributes("aria-label") === "type Component");
    await componentType?.trigger("click");
    await flush();
    const checkoutWorker = wrapper
      .findAll(".explorer-resource")
      .find((r) => r.attributes("aria-label") === "resource checkout-worker");
    await checkoutWorker?.trigger("click");
    await flush();
    // The relation chip "API · payments-v3" should be clickable.
    const apiRelation = wrapper
      .findAll(".relation-link")
      .find((r) => r.attributes("aria-label") === "go to API payments-v3");
    expect(apiRelation).toBeDefined();
    await apiRelation?.trigger("click");
    await flush();
    // Header should now show the API resource.
    expect(wrapper.find(".explorer-detail .detail-header h1").text()).toBe("payments-v3");
    // And the API type should be active in the left rail.
    const activeType = wrapper.find(".explorer-types .explorer-type.active");
    expect(activeType.attributes("aria-label")).toBe("type API");
  });
});

describe("Observer Console — node graph", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAsObserver();
  });

  it("renders a directed graph of nodes when activated", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /node graph/i);
    const svg = wrapper.find(".graph-canvas svg");
    expect(svg.exists()).toBe(true);
    // Sensors + filters from the model.
    expect(wrapper.text()).toContain("git-main");
    expect(wrapper.text()).toContain("structural-0");
    expect(wrapper.text()).toContain("reference-1");
    // Edges = number of subscriber relations across nodes.
    const edges = svg.findAll("g[aria-label='edges'] > g");
    expect(edges.length).toBeGreaterThan(0);
  });
});

describe("Observer Console — admin gating", () => {
  it("does not render the Users nav for non-admin observers", async () => {
    signInAsObserver();
    const wrapper = mountApp();
    await flush();
    const labels = wrapper.findAll(".sidebar .nav-item").map((n) => n.attributes("aria-label"));
    expect(labels).not.toContain("Users");
  });

  it("renders the Users view for an admin", async () => {
    signInAsAdmin();
    const wrapper = mountApp();
    await flush();
    const labels = wrapper.findAll(".sidebar .nav-item").map((n) => n.attributes("aria-label"));
    expect(labels).toContain("Users");

    await activateNav(wrapper, /^users$/i);
    expect(wrapper.find(".users-table").exists()).toBe(true);
  });

  it("shows the LoginView when not authenticated", async () => {
    const wrapper = mountApp();
    await flush();
    expect(wrapper.find(".login-shell").exists()).toBe(true);
    expect(wrapper.find(".topbar").exists()).toBe(false);
  });
});

describe("Observer Console — tweaks", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    signInAsObserver();
  });

  it("opens the tweaks panel and switches theme on <html>", async () => {
    const wrapper = mountApp();
    await flush();
    const cog = wrapper.find('[aria-label="Toggle tweaks panel"]');
    await cog.trigger("click");
    await flush();

    const paperOpt = wrapper.find('[aria-label="theme: paper"]');
    expect(paperOpt.exists()).toBe(true);
    await paperOpt.trigger("click");
    await flush();

    expect(document.documentElement.dataset.theme).toBe("paper");
  });
});
