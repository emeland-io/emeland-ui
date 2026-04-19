import { beforeEach, describe, expect, it } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

import App from "@/App.vue";

const firstOpenFinding = 'Context "checkout-eu" has no ContextType set';
const preAckedFinding = 'Node "gpu-worker-07.eu-west-1" has no NodeType';
const snoozedFinding = 'Context "sso-prod" has no ContextType set';

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

describe("Observer Console — navigation and counts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the inbox by default with open findings", async () => {
    const wrapper = mountApp();
    await flush();
    const texts = rowTexts(wrapper);
    expect(texts.some((t) => t.includes(firstOpenFinding))).toBe(true);
    expect(texts.some((t) => t.includes(preAckedFinding))).toBe(false);
    expect(texts.some((t) => t.includes(snoozedFinding))).toBe(false);
  });

  it("sidebar shows the correct counts from the mock data", async () => {
    const wrapper = mountApp();
    await flush();
    expect(navItemFor(wrapper, /alert inbox/i)?.find(".count").text()).toBe("8");
    expect(navItemFor(wrapper, /acknowledged/i)?.find(".count").text()).toBe("1");
    expect(navItemFor(wrapper, /^snoozed$/i)?.find(".count").text()).toBe("1");
    expect(navItemFor(wrapper, /^resolved$/i)?.find(".count").text()).toBe("1");
  });

  it("switches to the Acknowledged tab and shows the pre-acked finding", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /acknowledged/i);
    const texts = rowTexts(wrapper);
    expect(texts.some((t) => t.includes(preAckedFinding))).toBe(true);
    expect(texts.some((t) => t.includes(firstOpenFinding))).toBe(false);
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

describe("Observer Console — single-finding actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("acknowledges a finding and moves it to the Acknowledged tab", async () => {
    const wrapper = mountApp();
    await flush();
    const row = listRows(wrapper).find((r) => r.text().includes(firstOpenFinding));
    await row?.trigger("click");
    await flush();
    const ackButton = wrapper
      .findAll(".actions .btn")
      .find((b) => b.text().trim().startsWith("Acknowledge"));
    await ackButton?.trigger("click");
    await flush();

    expect(rowTexts(wrapper).some((t) => t.includes(firstOpenFinding))).toBe(false);

    await activateNav(wrapper, /acknowledged/i);
    expect(rowTexts(wrapper).some((t) => t.includes(firstOpenFinding))).toBe(true);
  });

  it("re-opens an acknowledged finding", async () => {
    const wrapper = mountApp();
    await flush();
    await activateNav(wrapper, /acknowledged/i);
    const row = listRows(wrapper).find((r) => r.text().includes(preAckedFinding));
    await row?.trigger("click");
    await flush();
    const reopen = wrapper.findAll(".actions .btn").find((b) => /re-open/i.test(b.text()));
    await reopen?.trigger("click");
    await flush();

    await activateNav(wrapper, /alert inbox/i);
    expect(rowTexts(wrapper).some((t) => t.includes(preAckedFinding))).toBe(true);
  });

  it("snoozes a finding and moves it to the Snoozed tab", async () => {
    const wrapper = mountApp();
    await flush();
    const row = listRows(wrapper).find((r) => r.text().includes(firstOpenFinding));
    await row?.trigger("click");
    await flush();
    const snooze = wrapper.findAll(".actions .btn").find((b) => /snooze 4h/i.test(b.text()));
    await snooze?.trigger("click");
    await flush();

    await activateNav(wrapper, /^snoozed$/i);
    expect(rowTexts(wrapper).some((t) => t.includes(firstOpenFinding))).toBe(true);
  });

  it("resolves a finding via the modal with a reason", async () => {
    const wrapper = mountApp();
    await flush();
    const row = listRows(wrapper).find((r) => r.text().includes(firstOpenFinding));
    await row?.trigger("click");
    await flush();
    const resolve = wrapper.findAll(".actions .btn").find((b) => /resolve…/i.test(b.text()));
    await resolve?.trigger("click");
    await flush();

    const modal = wrapper.find(".modal");
    expect(modal.exists()).toBe(true);
    await modal.find("textarea").setValue("deploy landed");
    const resolveButton = modal.findAll(".btn").find((b) => b.text().trim() === "Resolve");
    await resolveButton?.trigger("click");
    await flush();

    await activateNav(wrapper, /^resolved$/i);
    expect(rowTexts(wrapper).some((t) => t.includes(firstOpenFinding))).toBe(true);
  });

  it("posts a comment and surfaces it in the activity timeline", async () => {
    const wrapper = mountApp();
    await flush();
    const row = listRows(wrapper).find((r) => r.text().includes(firstOpenFinding));
    await row?.trigger("click");
    await flush();
    const textarea = wrapper.find(".composer textarea");
    await textarea.setValue("pinged maya");
    const post = wrapper.findAll(".composer .btn").find((b) => /post note/i.test(b.text()));
    await post?.trigger("click");
    await flush();
    expect(wrapper.find(".timeline").text()).toContain("pinged maya");
  });
});

describe("Observer Console — bulk actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("bulk-acknowledges selected findings", async () => {
    const wrapper = mountApp();
    await flush();
    const checkboxes = wrapper.findAll(".finding-list .cb");
    await checkboxes[0].trigger("click");
    await checkboxes[1].trigger("click");
    await flush();

    const selectionBar = wrapper.find(".selection-bar");
    expect(selectionBar.exists()).toBe(true);
    expect(selectionBar.text()).toContain("2 selected");

    const ackButton = selectionBar.findAll(".btn").find((b) => /acknowledge/i.test(b.text()));
    await ackButton?.trigger("click");
    await flush();

    await activateNav(wrapper, /^acknowledged$/i);
    // Pre-acked finding + the two we just acked → 3 rows.
    expect(listRows(wrapper).length).toBe(3);
  });
});

describe("Observer Console — tweaks", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
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
