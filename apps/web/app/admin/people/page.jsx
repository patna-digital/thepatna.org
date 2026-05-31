import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { reorderPersonAction, deletePersonAction } from "./actions";

export const metadata = { title: "People | PATNA Admin" };

const SECTIONS = [
  { value: "all",         label: "All" },
  { value: "board",       label: "Board of Directors" },
  { value: "secretariat", label: "Secretariat" },
  { value: "research",    label: "Research Contributors" },
];

const SECTION_LABELS = {
  board:       "Board of Directors",
  secretariat: "Secretariat",
  research:    "Research Contributors",
};

const SECTION_DESCRIPTION = {
  board:       "Governance and strategic leadership of the PATNA Initiative.",
  secretariat: "Operational team running the day-to-day activities of the Secretariat.",
  research:    "UCL Energy Institute researchers and PATNA research associates.",
};

function getNoticeMessage(notice) {
  const map = {
    saved:             "Profile saved successfully.",
    deleted:           "Profile deleted.",
    reordered:         "Display order updated.",
    error:             "Something went wrong. Please try again.",
    "missing-fields":  "Name and section are required.",
  };
  return map[notice] || "";
}

function getInitials(name = "") {
  const skip = new Set(["Dr", "Dr.", "Ambassador", "Amb.", "Maj", "Gen", "(Rt)", "Prof", "Prof.", "Assoc."]);
  return name.split(" ").filter((w) => !skip.has(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function PersonRow({ person, isFirst, isLast }) {
  return (
    <div className={`people-row${!person.is_active ? " is-inactive" : ""}`}>
      <div className="people-row-avatar">
        {person.photo_url ? (
          <img alt={person.full_name} src={person.photo_url} />
        ) : (
          <span>{getInitials(person.full_name)}</span>
        )}
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
        {/* Reorder */}
        <div className="people-reorder-btns">
          <form action={reorderPersonAction}>
            <input name="person_id" type="hidden" value={person.id} />
            <input name="section" type="hidden" value={person.section} />
            <input name="direction" type="hidden" value="up" />
            <button
              aria-label="Move up"
              className="people-order-btn"
              disabled={isFirst}
              title="Move up"
              type="submit"
            >↑</button>
          </form>
          <form action={reorderPersonAction}>
            <input name="person_id" type="hidden" value={person.id} />
            <input name="section" type="hidden" value={person.section} />
            <input name="direction" type="hidden" value="down" />
            <button
              aria-label="Move down"
              className="people-order-btn"
              disabled={isLast}
              title="Move down"
              type="submit"
            >↓</button>
          </form>
        </div>

        <Link className="secondary-button btn-sm" href={`/admin/people/${person.id}`}>
          Edit
        </Link>
      </div>
    </div>
  );
}

export default async function AdminPeoplePage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolved = await searchParams;
  const activeSection = typeof resolved?.section === "string" ? resolved.section : "all";
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  let query = supabase
    .from("people_profiles")
    .select("id, section, full_name, title, organisation, email, linkedin_url, photo_url, display_order, is_active")
    .order("section")
    .order("display_order");

  if (activeSection !== "all") {
    query = query.eq("section", activeSection);
  }

  const { data: people, error } = await query;

  // Count per section for tab badges
  const counts = { board: 0, secretariat: 0, research: 0 };
  (people || []).forEach((p) => { if (counts[p.section] !== undefined) counts[p.section]++; });

  // Group by section for rendering
  const grouped = {};
  (people || []).forEach((p) => {
    if (!grouped[p.section]) grouped[p.section] = [];
    grouped[p.section].push(p);
  });

  const sectionsToShow = activeSection === "all"
    ? ["board", "secretariat", "research"]
    : [activeSection];

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Website"
      navItems={adminNav}
      spotlight={{
        label: "People profiles",
        title: "Board, Secretariat & Research Contributors",
        body: "Manage the profiles shown on the About page. Changes go live immediately.",
      }}
      title="People"
      subtitle="Board of Directors, Secretariat, and Research Contributors shown on the public about page."
    >
      {/* Stats */}
      <div className="admin-stat-grid admin-stat-grid-4">
        {["board", "secretariat", "research"].map((s) => (
          <div className="admin-stat-card" key={s}>
            <strong>{counts[s]}</strong>
            <h4>{SECTION_LABELS[s]}</h4>
          </div>
        ))}
        <div className="admin-stat-card tone-success">
          <strong>{(people || []).filter((p) => p.is_active).length}</strong>
          <h4>Visible</h4>
          <p>Shown publicly</p>
        </div>
      </div>

      {/* Toolbar */}
      <article className="dashboard-card admin-toolbar-card">
        <div className="stack">
          <div className="admin-toolbar-main">
            <div className="dashboard-toolbar">
              {SECTIONS.map((tab) => (
                <Link
                  className={activeSection === tab.value ? "filter-tab active-filter" : "filter-tab"}
                  href={tab.value === "all" ? "/admin/people" : `/admin/people?section=${tab.value}`}
                  key={tab.value}
                >
                  {tab.label}
                  {tab.value !== "all" && (
                    <span className="filter-tab-count"> ({counts[tab.value]})</span>
                  )}
                </Link>
              ))}
            </div>
            <Link className="primary-button" href="/admin/people/new">
              + Add person
            </Link>
          </div>
          {notice && (
            <p className={notice === "error" || notice === "missing-fields" ? "form-error" : "form-success"}>
              {getNoticeMessage(notice)}
            </p>
          )}
          {error && <p className="form-error">{error.message}</p>}
        </div>
      </article>

      {/* People grouped by section */}
      {sectionsToShow.map((sectionKey) => {
        const items = grouped[sectionKey] || [];
        return (
          <section key={sectionKey}>
            <div className="people-section-header">
              <div>
                <h2 className="people-section-title">{SECTION_LABELS[sectionKey]}</h2>
                <p className="people-section-desc">{SECTION_DESCRIPTION[sectionKey]}</p>
              </div>
              <Link
                className="secondary-button"
                href={`/admin/people/new?section=${sectionKey}`}
              >
                + Add to {SECTION_LABELS[sectionKey]}
              </Link>
            </div>

            <article className="dashboard-card people-list-card">
              {items.length === 0 ? (
                <div className="app-row-empty">
                  <strong>No {SECTION_LABELS[sectionKey].toLowerCase()} profiles yet.</strong>
                  <Link className="secondary-button" href={`/admin/people/new?section=${sectionKey}`}>
                    Add first profile
                  </Link>
                </div>
              ) : (
                <div className="people-list">
                  {items.map((person, idx) => (
                    <PersonRow
                      isFirst={idx === 0}
                      isLast={idx === items.length - 1}
                      key={person.id}
                      person={person}
                    />
                  ))}
                </div>
              )}
            </article>
          </section>
        );
      })}
    </DashboardShell>
  );
}
