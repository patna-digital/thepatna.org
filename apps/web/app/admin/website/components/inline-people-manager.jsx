"use client";

import { useState } from "react";
import Link from "next/link";
import { reorderPersonAction } from "@/app/admin/people/actions";

const SECTIONS = [
  { key: "board",       label: "Board of Directors" },
  { key: "secretariat", label: "Secretariat" },
  { key: "research",    label: "Research Contributors" },
];

function getInitials(name = "") {
  const skip = new Set(["Dr", "Dr.", "Ambassador", "Amb.", "Maj", "Gen", "(Rt)", "Prof", "Prof.", "Assoc."]);
  return name
    .split(" ")
    .filter((w) => !skip.has(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function PersonRow({ person, isFirst, isLast }) {
  return (
    <div className={`people-row${!person.is_active ? " is-inactive" : ""}`}>
      <div className="people-row-avatar">
        {person.photo_url
          ? <img alt={person.full_name} src={person.photo_url} />
          : <span>{getInitials(person.full_name)}</span>
        }
      </div>

      <div className="people-row-body">
        <div className="people-row-name">
          <strong>{person.full_name}</strong>
          {!person.is_active && <span className="status-chip chip-muted">Hidden</span>}
          {person.linkedin_url && (
            <a
              aria-label={`${person.full_name} on LinkedIn`}
              className="people-row-linkedin"
              href={person.linkedin_url}
              rel="noreferrer"
              target="_blank"
            >
              in
            </a>
          )}
        </div>
        <div className="people-row-meta">
          {person.title && <span>{person.title}</span>}
          {person.organisation && <span className="people-row-org">{person.organisation}</span>}
          {person.email && (
            <a className="people-row-email" href={`mailto:${person.email}`}>{person.email}</a>
          )}
        </div>
      </div>

      <div className="people-row-actions">
        <div className="people-reorder-btns">
          <form action={reorderPersonAction}>
            <input name="person_id" type="hidden" value={person.id} />
            <input name="section" type="hidden" value={person.section} />
            <input name="direction" type="hidden" value="up" />
            <button aria-label="Move up" className="people-order-btn" disabled={isFirst} title="Move up" type="submit">↑</button>
          </form>
          <form action={reorderPersonAction}>
            <input name="person_id" type="hidden" value={person.id} />
            <input name="section" type="hidden" value={person.section} />
            <input name="direction" type="hidden" value="down" />
            <button aria-label="Move down" className="people-order-btn" disabled={isLast} title="Move down" type="submit">↓</button>
          </form>
        </div>
        <Link className="secondary-button btn-sm" href={`/admin/people/${person.id}`}>
          Edit
        </Link>
      </div>
    </div>
  );
}

export function InlinePeopleManager({ people, peopleCounts }) {
  const [activeSection, setActiveSection] = useState("board");

  const grouped = {};
  people.forEach((p) => {
    if (!grouped[p.section]) grouped[p.section] = [];
    grouped[p.section].push(p);
  });

  const items = grouped[activeSection] || [];

  return (
    <div className="inline-people-manager">
      {/* Section tabs */}
      <div className="inline-people-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`filter-tab${activeSection === s.key ? " active-filter" : ""}`}
            onClick={() => setActiveSection(s.key)}
            type="button"
          >
            {s.label}
            <span className="filter-tab-count"> ({peopleCounts[s.key] || 0})</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <Link
          className="primary-button btn-sm"
          href={`/admin/people/new?section=${activeSection}`}
        >
          + Add person
        </Link>
      </div>

      {/* People list */}
      <article className="dashboard-card people-list-card" style={{ marginTop: "0.75rem" }}>
        {items.length === 0 ? (
          <div className="app-row-empty">
            <strong>No profiles in this section yet.</strong>
            <Link className="secondary-button" href={`/admin/people/new?section=${activeSection}`}>
              Add first profile
            </Link>
          </div>
        ) : (
          <div className="people-list">
            {items.map((person, idx) => (
              <PersonRow
                key={person.id}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                person={person}
              />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
