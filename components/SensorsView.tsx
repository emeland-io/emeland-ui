"use client";

import { SENSORS } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export const SensorsView = () => (
  <div style={{ padding: 22 }}>
    <h2 style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>Sensors</h2>
    <p style={{ color: "var(--text-dim)", maxWidth: 600 }}>
      Sensors feed the model server. Findings are side-effects of filter functions that inspect every event; a
      sensor going silent means the model stops converging.
    </p>
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
        marginTop: 20,
      }}
    >
      {Object.values(SENSORS).map((s) => (
        <div
          key={s.id}
          style={{
            padding: 16,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: s.status === "healthy" ? "var(--accent)" : "var(--sev-med)",
              }}
            />
            <span className="mono" style={{ fontSize: 13 }}>
              {s.id}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-mute)" }}>{s.kind}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontSize: 11, color: "var(--text-mute)" }}>last event {timeAgo(s.lastSeen)}</div>
        </div>
      ))}
    </div>
  </div>
);
