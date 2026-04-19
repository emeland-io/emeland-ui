"use client";

import { CONTEXTS } from "@/lib/data";
import type { Finding, FindingType } from "@/lib/types";
import { classNames, timeAgo } from "@/lib/utils";

type FindingRowProps = {
  finding: Finding;
  types: Record<string, FindingType>;
  selected?: boolean;
  dimmed?: boolean;
  checked?: boolean;
  onClick: () => void;
  onToggle: (findingId: string) => void;
};

export const FindingRow = ({
  finding,
  types,
  selected,
  dimmed,
  checked,
  onClick,
  onToggle,
}: FindingRowProps) => {
  const type = types[finding.typeKind];
  const contextLabel = CONTEXTS[finding.contextId]?.displayName ?? "—";
  const primaryResource = finding.resources[0];

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const handleToggleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onToggle(finding.findingId);
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onToggle(finding.findingId);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${finding.typeKind}: ${finding.summary}`}
      aria-selected={selected}
      className={classNames("row", selected && "selected", dimmed && "dimmed")}
      onClick={onClick}
      onKeyDown={handleRowKeyDown}
    >
      <div className={`bar sev-${type?.severity ?? "low"}`} />
      <span
        role="checkbox"
        tabIndex={0}
        aria-checked={!!checked}
        aria-label={checked ? "Deselect finding" : "Select finding"}
        className={classNames("cb", checked && "checked")}
        onClick={handleToggleClick}
        onKeyDown={handleToggleKeyDown}
        style={{ marginLeft: 10 }}
      />
      <span className={`state-dot ${finding.state}`} title={finding.state} style={{ marginLeft: 0 }} />
      <div className="main-col">
        <div className="kind">{finding.typeKind}</div>
        <div className="summary">{finding.summary}</div>
        <div className="meta">
          <span className="sensor">{finding.sensor}</span>
          <span>
            {primaryResource?.resourceType} · {primaryResource?.displayName}
          </span>
        </div>
      </div>
      <div className="ctx" title="Context">
        {contextLabel}
      </div>
      <div className="count-col" title="occurrence count">
        ×{finding.count}
      </div>
      <div className="time-col">{timeAgo(finding.lastSeen)}</div>
    </div>
  );
};
