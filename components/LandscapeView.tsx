"use client";

type LandscapeItem = {
  type: string;
  name: string;
  uuid: string;
  findings: number;
};

const ITEMS: LandscapeItem[] = [
  { type: "System", name: "checkout", uuid: "c9b72e1a-…-aaaa-101", findings: 2 },
  { type: "System", name: "identity-platform", uuid: "c9b72e1a-…-aaaa-102", findings: 1 },
  { type: "System", name: "ml-platform", uuid: "c9b72e1a-…-aaaa-103", findings: 2 },
  { type: "API", name: "payments-v3", uuid: "a1b2c3d4-…-aaaa-201", findings: 1 },
  { type: "API", name: "identity-saml", uuid: "a1b2c3d4-…-aaaa-202", findings: 1 },
  { type: "Component", name: "checkout-worker", uuid: "f0e1d2c3-…-aaaa-301", findings: 1 },
  { type: "Component", name: "ml-trainer", uuid: "f0e1d2c3-…-aaaa-302", findings: 0 },
  { type: "Context", name: "Payments", uuid: "b1f3e1c2-…-9111-01", findings: 3 },
  { type: "Context", name: "ML Platform", uuid: "b1f3e1c2-…-9111-03", findings: 2 },
  { type: "Node", name: "ip-10-0-12-44.us-east-2", uuid: "a1b2c3d4-…-aaaa-401", findings: 1 },
];

export const LandscapeView = () => (
  <>
    <div style={{ padding: "18px 22px 0" }}>
      <h2 style={{ fontWeight: 500, letterSpacing: "-0.01em", margin: 0 }}>Model explorer</h2>
      <p style={{ color: "var(--text-dim)", maxWidth: 600 }}>
        Resources currently in the landscape, grouped by type. Tiles show finding count — a quick way to see which
        parts of the model are fraying.
      </p>
    </div>
    <div className="landscape-grid">
      {ITEMS.map((r) => (
        <div key={`${r.type}-${r.name}`} className="resource-tile">
          <div className="type">{r.type}</div>
          <div className="name">{r.name}</div>
          <div className="uuid">{r.uuid}</div>
          {r.findings > 0 && (
            <div className="findings">
              {r.findings} open finding{r.findings > 1 ? "s" : ""}
            </div>
          )}
        </div>
      ))}
    </div>
  </>
);
