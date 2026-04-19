"use client";

import { FINDING_TYPES } from "@/lib/data";
import { severityVar } from "@/lib/utils";

export const ClassesView = () => (
  <div style={{ padding: 22 }}>
    <h2 style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>Finding classes</h2>
    <p style={{ color: "var(--text-dim)", maxWidth: 600 }}>
      Built-in finding kinds. Each has a deterministic UUID v5 derived from the kind name, so filters can produce
      stable findings without pre-registering a FindingType resource.
    </p>
    <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {Object.entries(FINDING_TYPES).map(([kind, type], i) => (
        <div
          key={kind}
          style={{
            display: "grid",
            gridTemplateColumns: "220px 80px 1fr 260px",
            gap: 16,
            padding: "12px 16px",
            borderTop: i ? "1px solid var(--border)" : 0,
            background: i % 2 ? "var(--bg-1)" : "var(--bg)",
          }}
        >
          <div className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>
            {kind}
          </div>
          <div
            className="state-badge"
            style={{
              color: severityVar(type.severity),
              border: "1px solid var(--border)",
              alignSelf: "center",
              textAlign: "center",
            }}
          >
            {type.severity}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{type.description}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--text-mute)", alignSelf: "center" }}>
            {type.id}
          </div>
        </div>
      ))}
    </div>
  </div>
);
