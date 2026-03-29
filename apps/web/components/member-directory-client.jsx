"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Link from "next/link";

const LAYOUT_STORAGE_KEY = "patna-member-directory-layout";

function getInitials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "P";
}

function renderSummary(member) {
  const roleAndOrg = [member.role_title, member.organisation_name].filter(Boolean).join(" · ");
  return roleAndOrg || "Role or organisation still being completed";
}

export function MemberDirectoryClient({ currentUserId, members }) {
  const [layout, setLayout] = useState("grid");

  useEffect(() => {
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);

    if (stored === "list" || stored === "grid") {
      setLayout(stored);
    }
  }, []);

  function updateLayout(nextLayout) {
    setLayout(nextLayout);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout);
  }

  return (
    <div className="stack">
      <div className="directory-toolbar">
        <div>
          <strong>All onboarded members</strong>
          <p className="muted-note">Every onboarded member with an active profile appears here, even while they are still completing optional parts of their profile.</p>
        </div>
        <div className="directory-layout-toggle">
          <button
            className={clsx("filter-tab", layout === "grid" && "active-filter")}
            onClick={() => updateLayout("grid")}
            type="button"
          >
            Grid
          </button>
          <button
            className={clsx("filter-tab", layout === "list" && "active-filter")}
            onClick={() => updateLayout("list")}
            type="button"
          >
            List
          </button>
        </div>
      </div>

      <div className={clsx(layout === "grid" ? "member-directory-grid" : "member-directory-list")}>
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          const tagNames = member.domainTags.slice(0, layout === "grid" ? 3 : 5).map((tag) => tag.name);

          return (
            <article className={clsx("dashboard-card", "member-directory-card", layout === "list" && "member-directory-card-list")} key={member.id}>
              <div className="member-directory-card-top">
                <div className="member-headshot-frame">
                  {member.headshotSrc ? (
                    <img
                      alt={`${member.displayName} headshot`}
                      className="member-headshot-image"
                      src={member.headshotSrc}
                    />
                  ) : (
                    <span className="member-headshot-fallback">{getInitials(member.displayName)}</span>
                  )}
                </div>

                <div className="member-directory-copy">
                  <div className="member-directory-name-row">
                    <strong>{member.displayName}</strong>
                    {isSelf ? <span className="status-chip">You</span> : null}
                    <span className="status-chip">{member.availabilityStatus}</span>
                  </div>
                  <p>{renderSummary(member)}</p>
                  <div className="item-meta">
                    <span>{member.primaryCohort?.name || "Cohort pending"}</span>
                    {member.country_of_residence ? <span>{member.country_of_residence}</span> : null}
                  </div>
                </div>
              </div>

              {tagNames.length ? (
                <div className="content-meta">
                  {tagNames.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}

              {isSelf ? (
                <div className="member-directory-card-actions">
                  <Link className="secondary-button" href="/app/profile">
                    Manage my profile
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
