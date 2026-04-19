"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { ClassesView } from "@/components/ClassesView";
import { FindingDetail, type ActionHandler } from "@/components/FindingDetail";
import { FindingRow } from "@/components/FindingRow";
import { Icon } from "@/components/Icon";
import { LandscapeView } from "@/components/LandscapeView";
import { Modal, type ModalState } from "@/components/Modal";
import { RulesView } from "@/components/RulesView";
import { SensorsView } from "@/components/SensorsView";
import { Sidebar, type SidebarCounts } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TweaksPanel } from "@/components/TweaksPanel";

import { CONTEXTS, FINDING_TYPES, FINDINGS, SENSORS } from "@/lib/data";
import type {
  ActiveView,
  Finding,
  FindingState,
  LocalState,
  Severity,
  Tweaks,
} from "@/lib/types";
import { TWEAK_DEFAULTS, classNames, severityOf } from "@/lib/utils";

const TWEAKS_STORAGE_KEY = "emeland_tweaks";

const TAB_STATE: Record<string, FindingState> = {
  inbox: "open",
  acknowledged: "acknowledged",
  snoozed: "snoozed",
  resolved: "resolved",
};

const FINDING_TABS: ActiveView[] = ["inbox", "acknowledged", "snoozed", "resolved"];

type Group = { label: string | null; items: Finding[] };

const ObserverConsole = () => {
  const [active, setActive] = useState<ActiveView>("inbox");
  const [selectedId, setSelectedId] = useState<string>(FINDINGS[0].findingId);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    severity: Severity | null;
    sensor: string | null;
    context: string | null;
    kind: string | null;
  }>({ severity: null, sensor: null, context: null, kind: null });
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS);
  const [tweaksHydrated, setTweaksHydrated] = useState(false);
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [local, setLocal] = useState<LocalState>({ overrides: {}, notes: {}, tickets: {} });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
      if (raw) setTweaks({ ...TWEAK_DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>) });
    } catch {
      // fall through — keep defaults
    }
    setTweaksHydrated(true);
  }, []);

  useEffect(() => {
    if (!tweaksHydrated) return;
    document.documentElement.dataset.theme = tweaks.theme;
    try {
      localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      // storage full / unavailable — safe to ignore
    }
  }, [tweaks, tweaksHydrated]);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }, []);

  const enrichedFindings = useMemo(
    () =>
      FINDINGS.map((f) => {
        const override = local.overrides[f.findingId];
        return override ? { ...f, ...override } : f;
      }),
    [local.overrides]
  );

  const counts = useMemo<SidebarCounts>(() => {
    const base: SidebarCounts = { open: 0, acknowledged: 0, snoozed: 0, resolved: 0 };
    enrichedFindings.forEach((f) => {
      base[f.state] = (base[f.state] ?? 0) + 1;
    });
    return base;
  }, [enrichedFindings]);

  const activeState = TAB_STATE[active];

  const filtered = useMemo(() => {
    let list = enrichedFindings;
    if (activeState) list = list.filter((f) => f.state === activeState);
    if (filters.severity) list = list.filter((f) => severityOf(f, FINDING_TYPES) === filters.severity);
    if (filters.sensor) list = list.filter((f) => f.sensor === filters.sensor);
    if (filters.context) list = list.filter((f) => f.contextId === filters.context);
    if (filters.kind) list = list.filter((f) => f.typeKind === filters.kind);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.summary.toLowerCase().includes(q) ||
          f.typeKind.toLowerCase().includes(q) ||
          f.findingId.startsWith(q) ||
          f.resources.some((r) => r.displayName?.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }, [enrichedFindings, activeState, filters, query]);

  const selected = filtered.find((f) => f.findingId === selectedId) ?? filtered[0];

  useEffect(() => {
    if (filtered.length && !filtered.find((f) => f.findingId === selectedId)) {
      setSelectedId(filtered[0].findingId);
    }
  }, [filtered, selectedId]);

  const applyToIds = useCallback(
    (ids: string[], fn: (next: LocalState, id: string) => void) => {
      setLocal((prev) => {
        const next: LocalState = {
          overrides: { ...prev.overrides },
          notes: { ...prev.notes },
          tickets: { ...prev.tickets },
        };
        ids.forEach((id) => fn(next, id));
        return next;
      });
    },
    []
  );

  const onAction: ActionHandler = useCallback(
    (action, finding, payload) => {
      const ids = finding ? [finding.findingId] : Array.from(selection);

      if (action === "ack") {
        applyToIds(ids, (n, id) => {
          n.overrides[id] = {
            state: "acknowledged",
            ackedBy: "you",
            ackedAt: new Date().toISOString(),
          };
        });
      } else if (action === "snooze") {
        applyToIds(ids, (n, id) => {
          n.overrides[id] = {
            state: "snoozed",
            snoozedBy: "you",
            snoozedUntil: new Date(Date.now() + 4 * 3600_000).toISOString(),
          };
        });
      } else if (action === "reopen") {
        applyToIds(ids, (n, id) => {
          n.overrides[id] = { state: "open" };
        });
      } else if (action === "resolveModal") {
        if (finding) setModal({ kind: "resolve", target: finding });
        return;
      } else if (action === "assign") {
        if (finding) setModal({ kind: "assign", target: finding });
        return;
      } else if (action === "link") {
        if (finding) setModal({ kind: "link", target: finding });
        return;
      } else if (action === "comment") {
        applyToIds(ids, (n, id) => {
          n.notes[id] = [
            ...(n.notes[id] ?? []),
            { by: "you", at: new Date().toISOString(), text: payload ?? "" },
          ];
        });
      }

      if (!finding) setSelection(new Set());
    },
    [applyToIds, selection]
  );

  const handleBulkResolve = () => {
    applyToIds(Array.from(selection), (n, id) => {
      n.overrides[id] = {
        state: "resolved",
        resolvedAt: new Date().toISOString(),
        resolvedReason: "Bulk resolved",
      };
    });
    setSelection(new Set());
  };

  const toggleSel = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const grouped = useMemo<Group[]>(() => {
    if (tweaks.groupBy === "none") return [{ label: null, items: filtered }];
    const map = new Map<string, Finding[]>();
    filtered.forEach((f) => {
      let label = "";
      if (tweaks.groupBy === "kind") label = f.typeKind;
      else if (tweaks.groupBy === "context") label = CONTEXTS[f.contextId]?.displayName ?? "Unscoped";
      else if (tweaks.groupBy === "sensor") label = f.sensor;
      const list = map.get(label);
      if (list) list.push(f);
      else map.set(label, [f]);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [filtered, tweaks.groupBy]);

  const renderAlt = () => {
    if (active === "sensors") return <SensorsView />;
    if (active === "explorer") return <LandscapeView />;
    if (active === "classes") return <ClassesView />;
    if (active === "rules") return <RulesView />;
    if (active === "settings")
      return <div className="empty">Settings — API server URL, auth, notifications</div>;
    return null;
  };

  const isFindingTab = FINDING_TABS.includes(active);
  const selCount = selection.size;

  const handleToggleTweaks = () => setTweaksVisible((v) => !v);

  const handleToggleSeverity = (severity: Severity) =>
    setFilters((f) => ({ ...f, severity: f.severity === severity ? null : severity }));

  const handleToggleSensor = (sensorId: string) =>
    setFilters((f) => ({ ...f, sensor: f.sensor === sensorId ? null : sensorId }));

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);

  const handleModalSubmit = (payload: string) => {
    if (!modal) return;
    if (modal.kind === "resolve") {
      applyToIds([modal.target.findingId], (n, id) => {
        n.overrides[id] = {
          state: "resolved",
          resolvedAt: new Date().toISOString(),
          resolvedReason: payload,
        };
      });
    } else if (modal.kind === "assign") {
      applyToIds([modal.target.findingId], (n, id) => {
        n.notes[id] = [
          ...(n.notes[id] ?? []),
          { by: "you", at: new Date().toISOString(), text: `Assigned to ${payload}` },
        ];
      });
    } else if (modal.kind === "link") {
      applyToIds([modal.target.findingId], (n, id) => {
        n.tickets[id] = payload;
        n.notes[id] = [
          ...(n.notes[id] ?? []),
          { by: "you", at: new Date().toISOString(), text: `Linked ticket: ${payload}` },
        ];
      });
    }
    setModal(null);
  };

  return (
    <div className={classNames("app", tweaks.density === "dense" && "dense")}>
      <TopBar query={query} setQuery={setQuery} />
      <Sidebar active={active} setActive={setActive} counts={counts} />

      {isFindingTab ? (
        <div className={classNames("main", tweaks.layout === "full-detail" && "full-detail")}>
          <div className="list-pane">
            <div className="filters">
              {(["high", "medium", "low"] as const).map((s) => {
                const handleClick = () => handleToggleSeverity(s);
                return (
                  <div
                    key={s}
                    role="button"
                    tabIndex={0}
                    aria-pressed={filters.severity === s}
                    aria-label={`severity ${s}`}
                    className={classNames("chip", filters.severity === s && "active")}
                    onClick={handleClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick();
                      }
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: `var(--sev-${s === "medium" ? "med" : s})`,
                      }}
                    />
                    {s}
                  </div>
                );
              })}
              <span className="divider" />
              {Object.values(SENSORS).map((s) => {
                const handleClick = () => handleToggleSensor(s.id);
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={filters.sensor === s.id}
                    aria-label={`sensor ${s.id}`}
                    className={classNames("chip", filters.sensor === s.id && "active")}
                    onClick={handleClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick();
                      }
                    }}
                  >
                    <span className="mono">{s.id}</span>
                  </div>
                );
              })}
              <span className="divider" />
              <div className="search-mini">
                {Icon.search}
                <input
                  placeholder="filter findings…"
                  value={query}
                  onChange={handleQueryChange}
                  aria-label="Filter findings"
                />
              </div>
              <button
                type="button"
                className="btn ghost"
                onClick={handleToggleTweaks}
                style={{ marginLeft: "auto" }}
                aria-label="Toggle tweaks panel"
              >
                {Icon.cog}
              </button>
            </div>

            {selCount > 0 && (
              <div className="selection-bar" role="region" aria-label="Bulk actions">
                <span className="sel-count">{selCount} selected</span>
                <button type="button" className="btn" onClick={() => onAction("ack", null)}>
                  {Icon.check} Acknowledge
                </button>
                <button type="button" className="btn" onClick={() => onAction("snooze", null)}>
                  {Icon.snooze} Snooze 4h
                </button>
                <button type="button" className="btn" onClick={handleBulkResolve}>
                  {Icon.resolve} Resolve
                </button>
                <span style={{ flex: 1 }} />
                <button type="button" className="btn ghost" onClick={() => setSelection(new Set())}>
                  Clear
                </button>
              </div>
            )}

            <div className="finding-list">
              {filtered.length === 0 && (
                <div className="empty">
                  <div className="glyph">{Icon.check}</div>
                  <div>No findings match.</div>
                </div>
              )}
              {grouped.map((g, gi) => (
                <Fragment key={g.label ?? `g-${gi}`}>
                  {g.label && (
                    <div className="group-header">
                      {g.label} <span className="count">×{g.items.length}</span>
                    </div>
                  )}
                  {g.items.map((f) => (
                    <FindingRow
                      key={f.findingId}
                      finding={f}
                      types={FINDING_TYPES}
                      selected={f.findingId === selected?.findingId}
                      checked={selection.has(f.findingId)}
                      onToggle={toggleSel}
                      onClick={() => setSelectedId(f.findingId)}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </div>

          <div className="detail-pane">
            <FindingDetail finding={selected} types={FINDING_TYPES} onAction={onAction} localState={local} />
          </div>
        </div>
      ) : (
        <div style={{ overflow: "auto" }}>{renderAlt()}</div>
      )}

      {tweaksVisible && (
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksVisible(false)} />
      )}
      {modal && <Modal modal={modal} onClose={() => setModal(null)} onSubmit={handleModalSubmit} />}
    </div>
  );
};

export default ObserverConsole;
