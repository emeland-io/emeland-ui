"use client";

import { useEffect, useState } from "react";

import type { Finding, ModalKind } from "@/lib/types";

export type ModalState = { kind: ModalKind; target: Finding };

type ModalConfig = { title: string; placeholder: string; cta: string };

const CONFIGS: Record<ModalKind, ModalConfig> = {
  resolve: {
    title: "Resolve finding",
    placeholder: 'Reason (e.g. "Product team pushed the missing API manifest")',
    cta: "Resolve",
  },
  assign: {
    title: "Assign finding",
    placeholder: "@username or team (e.g. @maya, team-payments)",
    cta: "Assign",
  },
  link: {
    title: "Link external ticket",
    placeholder: "https://jira.../PAY-1234 or github.com/…/issues/42",
    cta: "Link",
  },
};

type ModalProps = {
  modal: ModalState;
  onClose: () => void;
  onSubmit: (payload: string) => void;
};

export const Modal = ({ modal, onClose, onSubmit }: ModalProps) => {
  const [value, setValue] = useState("");
  const config = CONFIGS[modal.kind];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();
  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close modal"
      className="modal-backdrop"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className="modal"
        onClick={handleModalClick}
      >
        <h3>{config.title}</h3>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
          {modal.target?.summary}
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={handleValueChange}
          placeholder={config.placeholder}
          aria-label={config.title}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={handleSubmit}>
            {config.cta}
          </button>
        </div>
      </div>
    </div>
  );
};
