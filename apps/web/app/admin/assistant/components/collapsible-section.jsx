"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible admin section wrapper.
 *
 * Props:
 *   id          — anchor id for scroll-to links
 *   icon        — React node (Lucide icon)
 *   title       — section heading string
 *   badge       — optional React node shown next to title (e.g. a status chip)
 *   meta        — optional string shown on the right of the header (e.g. "Last indexed: …")
 *   defaultOpen — whether to start expanded (default true)
 *   children    — section body content
 */
export function CollapsibleSection({
  id,
  icon,
  title,
  badge,
  meta,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="admin-section admin-collapsible" id={id}>
      <button
        className="admin-collapsible-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        type="button"
      >
        <div className="admin-collapsible-title-group">
          {icon && <span className="admin-section-icon">{icon}</span>}
          <h2 className="admin-section-title">{title}</h2>
          {badge && <span className="admin-collapsible-badge">{badge}</span>}
        </div>
        <div className="admin-collapsible-right">
          {meta && <span className="admin-collapsible-meta">{meta}</span>}
          <ChevronDown
            size={15}
            aria-hidden
            className={`admin-collapsible-chevron${open ? " is-open" : ""}`}
          />
        </div>
      </button>

      {open && <div className="admin-collapsible-body">{children}</div>}
    </section>
  );
}
