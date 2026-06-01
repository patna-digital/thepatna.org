"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  icon,
  title,
  description,
  summary,
  children,
  defaultOpen = false,
  badge,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="admin-section admin-collapsible">
      <button
        aria-expanded={isOpen}
        className="admin-collapsible-header"
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <div className="admin-collapsible-title-group">
          {icon && <div className="admin-section-icon">{icon}</div>}
          <div>
            <div className="admin-section-title">{title}</div>
            {description && (
              <div className="admin-section-description">{description}</div>
            )}
          </div>
          {badge != null && (
            <div className="admin-collapsible-badge">
              <span className="status-chip chip-neutral">{badge}</span>
            </div>
          )}
        </div>
        <div className="admin-collapsible-right">
          {!isOpen && summary && (
            <span className="admin-collapsible-meta">{summary}</span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`admin-collapsible-chevron${isOpen ? " is-open" : ""}`}
            size={16}
          />
        </div>
      </button>

      {isOpen && (
        <div className="admin-collapsible-body">
          {children}
        </div>
      )}
    </div>
  );
}
