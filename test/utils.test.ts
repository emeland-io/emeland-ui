import { describe, expect, it } from "vitest";

import { FINDING_TYPES } from "@/lib/data";
import type { Finding } from "@/lib/types";
import { severityOf, severityVar, shortId, timeAgo } from "@/lib/utils";

const MOCK_NOW = "2026-04-19T10:45:00Z";

const makeFinding = (typeKind: string): Finding => ({
  findingId: "00000000-0000-0000-0000-000000000001",
  typeKind,
  summary: "test",
  firstSeen: MOCK_NOW,
  lastSeen: MOCK_NOW,
  count: 1,
  resources: [],
  annotations: [],
  contextId: "ctx-payments",
  sensor: "git-main",
});

describe("timeAgo", () => {
  it("formats seconds", () => {
    expect(timeAgo("2026-04-19T10:44:30Z")).toBe("30s ago");
  });

  it("formats minutes", () => {
    expect(timeAgo("2026-04-19T10:15:00Z")).toBe("30m ago");
  });

  it("formats hours", () => {
    expect(timeAgo("2026-04-19T08:45:00Z")).toBe("2h ago");
  });

  it("formats days", () => {
    expect(timeAgo("2026-04-17T10:45:00Z")).toBe("2d ago");
  });
});

describe("shortId", () => {
  it("returns first 8 chars of a UUID", () => {
    expect(shortId("7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56001")).toBe("7a3f2c1e");
  });

  it("returns an em dash for undefined input", () => {
    expect(shortId(undefined)).toBe("—");
  });
});

describe("severityOf", () => {
  it("reads severity from the type map", () => {
    expect(severityOf(makeFinding("ContextTypeMissing"), FINDING_TYPES)).toBe("high");
    expect(severityOf(makeFinding("ContextParentNotFound"), FINDING_TYPES)).toBe("medium");
    expect(severityOf(makeFinding("SystemInstanceContextMissing"), FINDING_TYPES)).toBe("low");
  });

  it("falls back to low for unknown kinds", () => {
    expect(severityOf(makeFinding("UnknownKind"), FINDING_TYPES)).toBe("low");
  });
});

describe("severityVar", () => {
  it("maps medium to --sev-med and high/low to their var names", () => {
    expect(severityVar("high")).toBe("var(--sev-high)");
    expect(severityVar("medium")).toBe("var(--sev-med)");
    expect(severityVar("low")).toBe("var(--sev-low)");
  });
});
