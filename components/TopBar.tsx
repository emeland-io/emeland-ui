"use client";

import { Icon } from "./Icon";

type TopBarProps = {
  query: string;
  setQuery: (value: string) => void;
};

export const TopBar = ({ query, setQuery }: TopBarProps) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);
  return (
    <div className="topbar">
      <div className="brand">
        <div className="logo">EL</div>
        <div>
          EmELand <small>observer console</small>
        </div>
      </div>
      <span style={{ width: 20 }} />
      <div className="env">
        <span className="dot" />
        modelsrv · emeland.local/v1
      </div>
      <div className="spacer" />
      <div className="search">
        {Icon.search}
        <input
          placeholder="Search findings, resources, UUIDs… (⌘K)"
          value={query}
          onChange={handleQueryChange}
          aria-label="Search findings"
        />
        <span className="kbd">⌘K</span>
      </div>
    </div>
  );
};
