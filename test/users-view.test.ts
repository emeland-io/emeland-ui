import { describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";

import UsersView from "@/components/UsersView.vue";

const flush = async () => {
  await nextTick();
  await nextTick();
};

const rows = (wrapper: VueWrapper) => wrapper.findAll(".users-table .user-row");

describe("UsersView", () => {
  it("lists the seeded users with roles and statuses", async () => {
    const wrapper = mount(UsersView);
    await flush();
    const rowEls = rows(wrapper);
    expect(rowEls.length).toBe(3);
    expect(rowEls[0].text()).toContain("Maya Cortez");
    expect(rowEls[0].text()).toContain("admin");
  });

  it("adds a new user via the form", async () => {
    const wrapper = mount(UsersView);
    await flush();

    await wrapper.find("#new-user-name").setValue("Eve Admin");
    await wrapper.find("#new-user-email").setValue("eve@example.com");
    await wrapper.find("#new-user-role").setValue("admin");
    await wrapper.find(".user-form").trigger("submit");
    await flush();

    const added = rows(wrapper).find((r) => r.text().includes("Eve Admin"));
    expect(added).toBeDefined();
    expect(added?.text()).toContain("eve@example.com");
    expect(added?.text().toLowerCase()).toContain("admin");
  });

  it("rejects invalid email input", async () => {
    const wrapper = mount(UsersView);
    await flush();

    await wrapper.find("#new-user-name").setValue("Bad Email");
    await wrapper.find("#new-user-email").setValue("not-an-email");
    await wrapper.find(".user-form").trigger("submit");
    await flush();

    expect(wrapper.find('[role="alert"]').text().toLowerCase()).toContain("invalid email");
    expect(rows(wrapper).length).toBe(3);
  });

  it("changes a user's role via the inline select", async () => {
    const wrapper = mount(UsersView);
    await flush();

    const lutzRow = rows(wrapper).find((r) => r.text().includes("Lutz Berger"));
    expect(lutzRow).toBeDefined();
    await lutzRow?.find("select").setValue("admin");
    await flush();

    const updated = rows(wrapper).find((r) => r.text().includes("Lutz Berger"));
    expect((updated?.find("select").element as HTMLSelectElement).value).toBe("admin");
  });

  it("toggles a user's active status", async () => {
    const wrapper = mount(UsersView);
    await flush();

    const mayaRow = rows(wrapper).find((r) => r.text().includes("Maya Cortez"));
    expect(mayaRow?.text().toLowerCase()).toContain("active");
    const disableButton = mayaRow?.findAll("button").find((b) => /disable/i.test(b.text()));
    await disableButton?.trigger("click");
    await flush();

    const refreshed = rows(wrapper).find((r) => r.text().includes("Maya Cortez"));
    expect(refreshed?.text().toLowerCase()).toContain("disabled");
  });

  it("removes a user after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const wrapper = mount(UsersView);
    await flush();

    const samRow = rows(wrapper).find((r) => r.text().includes("Sam Okafor"));
    const removeButton = samRow?.findAll("button").find((b) => /remove/i.test(b.text()));
    await removeButton?.trigger("click");
    await flush();

    expect(rows(wrapper).some((r) => r.text().includes("Sam Okafor"))).toBe(false);
    confirmSpy.mockRestore();
  });

  it("keeps the user when removal is cancelled", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const wrapper = mount(UsersView);
    await flush();

    const samRow = rows(wrapper).find((r) => r.text().includes("Sam Okafor"));
    const removeButton = samRow?.findAll("button").find((b) => /remove/i.test(b.text()));
    await removeButton?.trigger("click");
    await flush();

    expect(rows(wrapper).some((r) => r.text().includes("Sam Okafor"))).toBe(true);
    confirmSpy.mockRestore();
  });
});
