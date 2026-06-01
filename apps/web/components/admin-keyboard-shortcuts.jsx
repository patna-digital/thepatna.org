"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS = [
  { label: "Focus search", keys: ["/"] },
  { label: "Go to Members", keys: ["g", "m"], nav: "/admin/members" },
  { label: "Go to Applications", keys: ["g", "a"], nav: "/admin/applications" },
  { label: "Go to Collaboration leads", keys: ["g", "c"], nav: "/admin/collaboration-leads" },
  { label: "Go to Partnership leads", keys: ["g", "p"], nav: "/admin/partnership-leads" },
  { label: "Go to Service requests", keys: ["g", "s"], nav: "/admin/service-requests" },
  { label: "Show this help", keys: ["?"] },
  { label: "Dismiss", keys: ["Esc"] },
];

export function AdminKeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingKey = useRef(null);
  const pendingTimer = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      const tag = e.target?.tagName?.toLowerCase();
      const inInput = tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable;

      // Escape always closes the help panel
      if (e.key === "Escape") {
        setHelpOpen(false);
        return;
      }

      // "/" focuses search when not in an input
      if (e.key === "/" && !inInput) {
        e.preventDefault();
        const search = document.querySelector('input[type="search"], input[name="search"], input[name="q"]');
        if (search) search.focus();
        return;
      }

      // "?" opens the shortcut help panel
      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      // Chord shortcuts (g + key)
      if (!inInput) {
        if (e.key === "g") {
          pendingKey.current = "g";
          clearTimeout(pendingTimer.current);
          pendingTimer.current = setTimeout(() => { pendingKey.current = null; }, 1500);
          return;
        }

        if (pendingKey.current === "g") {
          pendingKey.current = null;
          clearTimeout(pendingTimer.current);
          const routes = { m: "/admin/members", a: "/admin/applications", c: "/admin/collaboration-leads", p: "/admin/partnership-leads", s: "/admin/service-requests" };
          if (routes[e.key]) {
            e.preventDefault();
            router.push(routes[e.key]);
          }
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(pendingTimer.current);
    };
  }, [router]);

  if (!helpOpen) return null;

  return (
    <div
      className="admin-shortcuts-toast"
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="false"
    >
      <h4>Keyboard shortcuts</h4>
      {SHORTCUTS.map(({ label, keys }) => (
        <div key={label} className="admin-shortcut-row">
          <span className="admin-shortcut-label">{label}</span>
          <span className="admin-shortcut-keys">
            {keys.map((k) => (
              <kbd key={k} className="kbd">{k}</kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
