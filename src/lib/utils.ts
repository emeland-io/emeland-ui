import type { Finding, FindingType, Severity, Tweaks } from "./types";

// The design's mock data is anchored to 2026-04-19T10:45:00Z — using that as
// "now" keeps the relative timestamps stable during review.
const MOCK_NOW = new Date("2026-04-19T10:45:00Z").getTime();

export const timeAgo = (iso: string): string => {
  const diffSeconds = Math.round((MOCK_NOW - new Date(iso).getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.round(diffSeconds / 3600)}h ago`;
  return `${Math.round(diffSeconds / 86400)}d ago`;
};

export const shortId = (uuid: string | undefined): string => (uuid ? uuid.slice(0, 8) : "—");

export const severityOf = (finding: Finding, types: Record<string, FindingType>): Severity =>
  types[finding.typeKind]?.severity ?? "low";

export const severityVar = (severity: Severity): string =>
  severity === "medium" ? "var(--sev-med)" : severity === "high" ? "var(--sev-high)" : "var(--sev-low)";

export const TWEAK_DEFAULTS: Tweaks = {
  theme: "light",
  density: "comfortable",
  groupBy: "none",
  layout: "split",
};
