"use client";

import type { Tweaks } from "@/lib/types";
import { classNames } from "@/lib/utils";

type TweakKey = keyof Tweaks;

type TweaksPanelProps = {
  tweaks: Tweaks;
  setTweak: <K extends TweakKey>(key: K, value: Tweaks[K]) => void;
  onClose: () => void;
};

export const TweaksPanel = ({ tweaks, setTweak, onClose }: TweaksPanelProps) => {
  const renderOpt = <K extends TweakKey>(key: K, value: Tweaks[K], label: string) => {
    const active = tweaks[key] === value;
    const handleClick = () => setTweak(key, value);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setTweak(key, value);
      }
    };
    return (
      <span
        key={`${key}-${String(value)}`}
        role="button"
        tabIndex={0}
        aria-pressed={active}
        aria-label={`${String(key)}: ${label}`}
        className={classNames("opt", active && "active")}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="tweaks-panel" role="dialog" aria-label="Display tweaks">
      <h4>
        Tweaks
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="btn ghost"
          onClick={onClose}
          aria-label="Close tweaks"
          style={{ padding: "2px 6px", fontSize: 11 }}
        >
          ×
        </button>
      </h4>
      <div className="tweak-row">
        <label>Theme</label>
        <div className="opts">
          {renderOpt("theme", "dark", "Dark")}
          {renderOpt("theme", "light", "Light")}
          {renderOpt("theme", "paper", "Paper")}
          {renderOpt("theme", "amber", "Amber")}
        </div>
      </div>
      <div className="tweak-row">
        <label>Density</label>
        <div className="opts">
          {renderOpt("density", "comfortable", "Comfortable")}
          {renderOpt("density", "dense", "Dense")}
        </div>
      </div>
      <div className="tweak-row">
        <label>Layout</label>
        <div className="opts">
          {renderOpt("layout", "split", "Split")}
          {renderOpt("layout", "full-detail", "Full")}
        </div>
      </div>
      <div className="tweak-row">
        <label>Group by</label>
        <div className="opts">
          {renderOpt("groupBy", "none", "None")}
          {renderOpt("groupBy", "kind", "Kind")}
          {renderOpt("groupBy", "context", "Context")}
          {renderOpt("groupBy", "sensor", "Sensor")}
        </div>
      </div>
    </div>
  );
};
