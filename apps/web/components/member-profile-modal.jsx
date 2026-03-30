"use client";

import { useEffect } from "react";
import Link from "next/link";

function getCohortTone(slug) {
  if (slug === "academic") return "academic";
  if (slug === "industry") return "industry";
  if (slug === "civil-society") return "civil";
  return "policy";
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "P";
}

export function MemberProfileModal({ member, onClose, isAdmin = false, isSelf = false }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const tone = getCohortTone(member.primaryCohort?.slug);
  const allCohorts = [member.primaryCohort, ...(member.secondaryCohorts || [])].filter(Boolean);
  const displayName = member.displayNameLabel || member.displayName || "PATNA Member";
  const role = member.roleTitleLabel || member.role_title || "";
  const org = member.organisationLabel || member.organisation_name || "";
  const country = member.country_of_residence || "";
  const hasLanguages = (member.languages || []).length > 0;
  const hasFocusOrWork = Boolean(
    member.cohortProfile?.domain_knowledge ||
    member.cohortProfile?.focus_area ||
    member.cohortProfile?.notable_work ||
    member.cohortProfile?.opportunity_interest,
  );
  const visibleProjects = (member.relevantProjects || []).filter((p) => p.title);
  const isAvailable = member.availabilityStatus === "available";

  return (
    <div
      className="profile-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        aria-label={`Profile: ${displayName}`}
        aria-modal="true"
        className="profile-modal"
        role="dialog"
      >
        <button
          aria-label="Close profile"
          className="profile-modal-close"
          onClick={onClose}
          type="button"
        >
          <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          </svg>
        </button>

        {/* ── Hero ──────────────────────────────────── */}
        <div className={`profile-modal-hero tone-${tone}`}>
          <div className="profile-modal-hero-inner">
            <div className={`profile-modal-avatar tone-${tone}`}>
              {member.headshotSrc ? (
                <img alt={`${displayName} headshot`} src={member.headshotSrc} />
              ) : (
                getInitials(displayName)
              )}
            </div>

            <div className="profile-modal-identity">
              <h2 className="profile-modal-name">{displayName}</h2>
              {role ? <p className="profile-modal-role">{role}</p> : null}

              {(org || country) ? (
                <div className="profile-modal-location">
                  {org ? (
                    <span className="profile-modal-location-item">
                      <svg aria-hidden="true" fill="none" height="11" viewBox="0 0 12 12" width="11" xmlns="http://www.w3.org/2000/svg">
                        <rect height="7" rx="0.8" stroke="currentColor" strokeWidth="1.2" width="8" x="2" y="4" />
                        <path d="M4 4V3a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      {org}
                    </span>
                  ) : null}
                  {country ? (
                    <span className="profile-modal-location-item">
                      <svg aria-hidden="true" fill="none" height="11" viewBox="0 0 12 12" width="11" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 1a3.5 3.5 0 0 1 3.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 0 1 6 1Z" stroke="currentColor" strokeWidth="1.2" />
                        <circle cx="6" cy="4.5" fill="currentColor" r="1.2" />
                      </svg>
                      {country}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="profile-modal-tags-row">
                {allCohorts.map((cohort) => (
                  <span
                    className={`status-chip member-directory-cohort-chip tone-${getCohortTone(cohort.slug)}`}
                    key={cohort.slug}
                  >
                    {cohort.name}
                  </span>
                ))}
                {isAvailable ? (
                  <span className="profile-modal-availability-badge">
                    <span aria-hidden="true" className="profile-modal-avail-dot" />
                    Available
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────── */}
        <div className="profile-modal-body">

          {/* About */}
          {member.professional_bio ? (
            <div className="profile-modal-section">
              <p className="profile-modal-section-label">About</p>
              <p className="profile-modal-bio">{member.professional_bio}</p>
            </div>
          ) : null}

          {/* Expertise */}
          {member.domainTags?.length > 0 ? (
            <div className="profile-modal-section">
              <p className="profile-modal-section-label">Areas of expertise</p>
              <div className="profile-modal-tags-full">
                {member.domainTags.map((tag) => (
                  <span className="status-chip chip-neutral" key={tag.slug}>{tag.name}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Languages */}
          {hasLanguages ? (
            <div className="profile-modal-section">
              <p className="profile-modal-section-label">Languages</p>
              <div className="profile-modal-tags-full">
                {(member.languages || []).map((lang) => (
                  <span className="status-chip chip-neutral" key={lang}>{lang}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Work & focus */}
          {hasFocusOrWork ? (
            <div className="profile-modal-section">
              <p className="profile-modal-section-label">Work &amp; focus</p>
              <div className="profile-modal-work-grid">
                {member.cohortProfile?.domain_knowledge ? (
                  <div className="profile-modal-work-item">
                    <span className="profile-modal-work-label">Domain knowledge</span>
                    <p className="profile-modal-work-text">{member.cohortProfile.domain_knowledge}</p>
                  </div>
                ) : null}
                {member.cohortProfile?.focus_area ? (
                  <div className="profile-modal-work-item">
                    <span className="profile-modal-work-label">Focus area</span>
                    <p className="profile-modal-work-text">{member.cohortProfile.focus_area}</p>
                  </div>
                ) : null}
                {member.cohortProfile?.notable_work ? (
                  <div className="profile-modal-work-item">
                    <span className="profile-modal-work-label">Notable work</span>
                    <p className="profile-modal-work-text">{member.cohortProfile.notable_work}</p>
                  </div>
                ) : null}
                {member.cohortProfile?.opportunity_interest ? (
                  <div className="profile-modal-work-item">
                    <span className="profile-modal-work-label">Open to collaboration &amp; mentorship</span>
                    <p className="profile-modal-work-text">{member.cohortProfile.opportunity_interest}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Relevant projects */}
          {visibleProjects.length > 0 ? (
            <div className="profile-modal-section">
              <p className="profile-modal-section-label">Relevant projects</p>
              <ul className="profile-modal-projects-list">
                {visibleProjects.map((project, i) => (
                  <li key={`${project.title}-${i}`}>
                    {project.link ? (
                      <a href={project.link} rel="noreferrer" target="_blank">{project.title}</a>
                    ) : (
                      <span>{project.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Admin-only section */}
          {isAdmin ? (
            <div className="profile-modal-admin-section">
              <p className="profile-modal-section-label profile-modal-admin-label">Admin — not visible to members</p>
              <div className="profile-modal-meta-grid">
                <div className="profile-modal-meta-item">
                  <span className="profile-modal-meta-label">Email</span>
                  <span className="profile-modal-meta-value">{member.email}</span>
                </div>
                {(member.phone_number || member.whatsapp_number) ? (
                  <div className="profile-modal-meta-item">
                    <span className="profile-modal-meta-label">Phone / WhatsApp</span>
                    <span className="profile-modal-meta-value">
                      {[member.phone_number, member.whatsapp_number].filter(Boolean).join(" / ")}
                    </span>
                  </div>
                ) : null}
                <div className="profile-modal-meta-item">
                  <span className="profile-modal-meta-label">Onboarding</span>
                  <span className="profile-modal-meta-value">
                    {member.onboarding_status?.replace(/_/g, " ") || "—"}
                  </span>
                </div>
                <div className="profile-modal-meta-item">
                  <span className="profile-modal-meta-label">Profile status</span>
                  <span className="profile-modal-meta-value">{member.profileStatus || "—"}</span>
                </div>
                <div className="profile-modal-meta-item">
                  <span className="profile-modal-meta-label">Completeness</span>
                  <span className="profile-modal-meta-value">{member.completionPercent}%</span>
                </div>
                {member.timezone ? (
                  <div className="profile-modal-meta-item">
                    <span className="profile-modal-meta-label">Timezone</span>
                    <span className="profile-modal-meta-value">{member.timezone}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

        </div>

        {/* ── Footer ────────────────────────────────── */}
        <div className="profile-modal-footer">
          {isSelf ? (
            <Link className="secondary-button" href="/app/profile" onClick={onClose}>
              Edit profile
            </Link>
          ) : null}
          {isAdmin ? (
            <Link className="secondary-button" href={`/admin/members/${member.id}`}>
              Full admin view
            </Link>
          ) : null}
          <button className="primary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
