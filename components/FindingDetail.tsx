"use client";

import { useState, type ReactNode } from "react";

import type { Finding, FindingType, LocalState } from "@/lib/types";
import { classNames, severityVar, shortId, timeAgo } from "@/lib/utils";

import { Icon } from "./Icon";

export type DetailAction =
  | "ack"
  | "snooze"
  | "reopen"
  | "resolveModal"
  | "assign"
  | "link"
  | "comment";

export type ActionHandler = (
  action: DetailAction,
  finding: Finding | null,
  payload?: string
) => void;

type TimelineEvent = {
  kind: string;
  t: string;
  msg: ReactNode;
};

type FindingDetailProps = {
  finding: Finding | undefined;
  types: Record<string, FindingType>;
  localState: LocalState;
  onAction: ActionHandler;
};

export const FindingDetail = ({ finding, types, localState, onAction }: FindingDetailProps) => {
  const [noteText, setNoteText] = useState("");

  if (!finding) {
    return (
      <div className="empty">
        <div className="glyph">{Icon.bell}</div>
        <div>Select a finding to view details</div>
      </div>
    );
  }

  const type = types[finding.typeKind];
  const localNotes = localState.notes[finding.findingId] ?? [];

  const timeline: TimelineEvent[] = [
    {
      kind: "evt-detect",
      t: finding.firstSeen,
      msg: (
        <>
          Finding first detected by <span className="who">{finding.sensor}</span>
        </>
      ),
    },
    ...(finding.state === "acknowledged" && finding.ackedAt
      ? [
          {
            kind: "evt-ack",
            t: finding.ackedAt,
            msg: (
              <>
                Acknowledged by <span className="who">{finding.ackedBy}</span>
              </>
            ),
          } satisfies TimelineEvent,
        ]
      : []),
    ...(finding.state === "snoozed" && finding.snoozedUntil
      ? [
          {
            kind: "evt-snooze",
            t: finding.lastSeen,
            msg: (
              <>
                Snoozed by <span className="who">{finding.snoozedBy}</span> until{" "}
                <span className="who">{new Date(finding.snoozedUntil).toLocaleTimeString()}</span>
              </>
            ),
          } satisfies TimelineEvent,
        ]
      : []),
    ...localNotes.map(
      (n): TimelineEvent => ({
        kind: "evt-comment",
        t: n.at,
        msg: (
          <>
            <span className="who">{n.by}</span> commented
            <small>{n.text}</small>
          </>
        ),
      })
    ),
    ...(finding.state === "resolved" && finding.resolvedAt
      ? [
          {
            kind: "evt-resolve",
            t: finding.resolvedAt,
            msg: (
              <>
                Resolved
                <small>{finding.resolvedReason}</small>
              </>
            ),
          } satisfies TimelineEvent,
        ]
      : []),
    {
      kind: "",
      t: finding.lastSeen,
      msg: (
        <>
          Last occurrence — count now <span className="who">×{finding.count}</span>
        </>
      ),
    },
  ].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

  const handlePostNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    onAction("comment", finding, trimmed);
    setNoteText("");
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value);

  return (
    <>
      <div className="detail-header">
        <div className="kind-row">
          <span className="pill">{finding.typeKind}</span>
          <span className={`state-badge ${finding.state}`}>{finding.state}</span>
          <span style={{ flex: 1 }} />
          <span className="uuid">{finding.findingId}</span>
        </div>
        <h1>{finding.summary}</h1>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-dim)", flexWrap: "wrap" }}>
          <span>
            First seen <code>{timeAgo(finding.firstSeen)}</code>
          </span>
          <span>·</span>
          <span>
            Last seen <code>{timeAgo(finding.lastSeen)}</code>
          </span>
          <span>·</span>
          <span>
            Occurrences <code>×{finding.count}</code>
          </span>
          <span>·</span>
          <span>
            Severity <code style={{ color: severityVar(type?.severity ?? "low") }}>{type?.severity}</code>
          </span>
        </div>
      </div>

      <div className="actions">
        {finding.state !== "resolved" && finding.state !== "acknowledged" && (
          <button type="button" className="btn primary" onClick={() => onAction("ack", finding)}>
            {Icon.check} Acknowledge
          </button>
        )}
        {finding.state !== "snoozed" && finding.state !== "resolved" && (
          <button type="button" className="btn" onClick={() => onAction("snooze", finding)}>
            {Icon.snooze} Snooze 4h
          </button>
        )}
        <button type="button" className="btn" onClick={() => onAction("assign", finding)}>
          {Icon.user} Assign…
        </button>
        {finding.state === "acknowledged" && (
          <button type="button" className="btn" onClick={() => onAction("reopen", finding)}>
            Re-open
          </button>
        )}
        {finding.state !== "resolved" && (
          <button type="button" className="btn" onClick={() => onAction("resolveModal", finding)}>
            {Icon.resolve} Resolve…
          </button>
        )}
        <button type="button" className="btn" onClick={() => onAction("link", finding)}>
          {Icon.external} Link ticket
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn ghost" aria-label="View API response">
          <span className="mono" style={{ fontSize: 11 }}>
            GET /landscape/findings/{shortId(finding.findingId)}…
          </span>{" "}
          {Icon.external}
        </button>
      </div>

      <div className="detail-body">
        {(finding.description ?? type?.description) && (
          <div className="section">
            <h3>Description</h3>
            <div className="desc">{finding.description ?? type?.description}</div>
          </div>
        )}

        <div className="section">
          <h3>Finding class</h3>
          <div className="kv-grid">
            <dt>Class</dt>
            <dd>{finding.typeKind}</dd>
            <dt>Class UUID</dt>
            <dd>{type?.id}</dd>
            <dt>Phase</dt>
            <dd>phase 0 · structural integrity</dd>
            <dt>Auto-resolves</dt>
            <dd>yes — when referenced resource is registered</dd>
          </div>
        </div>

        <div className="section">
          <h3>Resources in this finding</h3>
          {finding.resources.map((r, i) => {
            const missing = r.displayName?.startsWith("(missing");
            const handleGoto = (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault();
            return (
              <div key={r.resourceId} className={classNames("resource-card", missing && "missing")}>
                <span className="type-badge">{r.resourceType}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="name">
                    {i === 0 ? "▸ " : ""}
                    {r.displayName}
                  </div>
                  <div className="uuid">{r.resourceId}</div>
                </div>
                {!missing && (
                  <a href="#" className="goto" onClick={handleGoto}>
                    view {Icon.external}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="section">
          <h3>Annotations</h3>
          <div>
            {finding.annotations.map((a, i) => (
              <span key={`${a.key}-${i}`} className="anno">
                <span className="k">{a.key}</span>
                <span className="v">{a.value}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Activity</h3>
          <div className="timeline">
            {timeline.map((event, i) => (
              <div key={i} className={classNames("event", event.kind)}>
                <div className="t">{timeAgo(event.t)}</div>
                <div className="dot-col">
                  <span className="dot" />
                </div>
                <div className="msg">{event.msg}</div>
              </div>
            ))}
          </div>
          <div className="composer">
            <textarea
              placeholder="Add a note… e.g. asked @maya to push the missing API manifest"
              value={noteText}
              onChange={handleNoteChange}
              aria-label="Add note"
            />
            <div className="composer-actions">
              <button type="button" className="btn ghost">
                Attach link
              </button>
              <button type="button" className="btn primary" onClick={handlePostNote}>
                {Icon.comment} Post note
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
