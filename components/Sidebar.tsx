"use client";

import type { JSX } from "react";
import { Fragment } from "react";

import { classNames } from "@/lib/utils";
import type { ActiveView } from "@/lib/types";

import { Icon } from "./Icon";

export type SidebarCounts = {
  open: number;
  acknowledged: number;
  snoozed: number;
  resolved: number;
};

type NavItem = { id: ActiveView; label: string; icon: JSX.Element; count?: number };
type NavGroup = { group: string; items: NavItem[] };

type SidebarProps = {
  active: ActiveView;
  setActive: (view: ActiveView) => void;
  counts: SidebarCounts;
};

export const Sidebar = ({ active, setActive, counts }: SidebarProps) => {
  const nav: NavGroup[] = [
    {
      group: "Triage",
      items: [
        { id: "inbox", label: "Alert inbox", icon: Icon.bell, count: counts.open },
        { id: "acknowledged", label: "Acknowledged", icon: Icon.check, count: counts.acknowledged },
        { id: "snoozed", label: "Snoozed", icon: Icon.snooze, count: counts.snoozed },
        { id: "resolved", label: "Resolved", icon: Icon.resolve, count: counts.resolved },
      ],
    },
    {
      group: "Landscape",
      items: [
        { id: "explorer", label: "Model explorer", icon: Icon.map },
        { id: "sensors", label: "Sensors", icon: Icon.radar, count: 4 },
        { id: "classes", label: "Finding classes", icon: Icon.book, count: 6 },
        { id: "rules", label: "Filter rules", icon: Icon.filter, count: 6 },
      ],
    },
    {
      group: "System",
      items: [{ id: "settings", label: "Settings", icon: Icon.cog }],
    },
  ];

  const handleKeyDown = (id: ActiveView) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActive(id);
    }
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      {nav.map((g) => (
        <Fragment key={g.group}>
          <div className="group">{g.group}</div>
          {g.items.map((item) => {
            const handleClick = () => setActive(item.id);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={item.label}
                aria-current={active === item.id ? "page" : undefined}
                className={classNames("nav-item", active === item.id && "active")}
                onClick={handleClick}
                onKeyDown={handleKeyDown(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && <span className="count">{item.count}</span>}
              </div>
            );
          })}
        </Fragment>
      ))}
    </aside>
  );
};
