"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function getInitials(name) {
  const parts = String(name || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "P";
}


function getSearchText(member) {
  return [
    member.displayNameLabel || member.displayName,
    member.roleTitleLabel || member.role_title,
    member.organisationLabel || member.organisation_name,
    member.country_of_residence,
    member.professional_bio,
    member.primaryCohort?.name,
    ...(member.domainTags || []).map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getBioExcerpt(member) {
  const source =
    member.professional_bio ||
    [
      member.roleTitleLabel || member.role_title,
      member.organisationLabel || member.organisation_name,
      member.country_of_residence,
    ]
      .filter(Boolean)
      .join(" · ");

  if (!source) {
    return "Profile summary still being completed.";
  }

  return source.length > 148 ? `${source.slice(0, 145)}...` : source;
}

function getCohortTone(cohortSlug) {
  if (cohortSlug === "academic") {
    return "academic";
  }

  if (cohortSlug === "industry") {
    return "industry";
  }

  if (cohortSlug === "civil-society") {
    return "civil";
  }

  return "policy";
}

function getSpaceCountLabel(count) {
  return `${count} space${count === 1 ? "" : "s"}`;
}

export function MemberDirectoryClient({ directory }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const filteredMembers = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return directory.members.filter((member) => {
      if (cohortFilter !== "all" && member.primaryCohort?.slug !== cohortFilter) {
        return false;
      }

      if (tagFilter !== "all" && !member.domainTags.some((tag) => tag.slug === tagFilter)) {
        return false;
      }

      if (countryFilter !== "all" && member.country_of_residence !== countryFilter) {
        return false;
      }

      if (normalisedSearch && !getSearchText(member).includes(normalisedSearch)) {
        return false;
      }

      return true;
    });
  }, [cohortFilter, countryFilter, directory.members, searchTerm, tagFilter]);

  return (
    <div className="member-directory-shell">
      <div className="member-directory-summary-row">
        {directory.summary.map((item) => (
          <button
            aria-pressed={cohortFilter === item.slug}
            className={`member-directory-summary-card tone-${getCohortTone(item.slug)}${
              cohortFilter === item.slug ? " is-active" : ""
            }`}
            key={item.slug}
            onClick={() => setCohortFilter((current) => (current === item.slug ? "all" : item.slug))}
            type="button"
          >
            <strong>{item.count}</strong>
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      <article className="member-directory-toolbar-card">
        <div className="member-directory-toolbar-grid">
          <label className="member-directory-search">
            <span aria-hidden="true" className="member-directory-search-icon">
              ⌕
            </span>
            <span className="sr-only">Search members</span>
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, org, or expertise..."
              type="search"
              value={searchTerm}
            />
          </label>

          <div className="member-directory-toolbar-controls">
            <div className="member-directory-selects">
              <select onChange={(event) => setCohortFilter(event.target.value)} value={cohortFilter}>
                <option value="all">All Cohorts</option>
                {directory.filters.cohorts.map((cohort) => (
                  <option key={cohort.slug} value={cohort.slug}>
                    {cohort.name}
                  </option>
                ))}
              </select>

              <select onChange={(event) => setTagFilter(event.target.value)} value={tagFilter}>
                <option value="all">All Tags</option>
                {directory.filters.tags.map((tag) => (
                  <option key={tag.slug} value={tag.slug}>
                    {tag.name}
                  </option>
                ))}
              </select>

              <select onChange={(event) => setCountryFilter(event.target.value)} value={countryFilter}>
                <option value="all">All Countries</option>
                {directory.filters.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="member-directory-toolbar-meta">
              <strong>{filteredMembers.length} results</strong>
            </div>
          </div>
        </div>
      </article>

      <div className="member-directory-grid member-directory-grid-rich">
        {filteredMembers.map((member) => {
          const isSelf = member.id === directory.currentUserId;
          const tone = getCohortTone(member.primaryCohort?.slug);
          const roleLabel = member.roleTitleLabel || "";
          const organisationLabel = member.organisationLabel || "";
          const organisationLine = [organisationLabel, member.country_of_residence].filter(Boolean).join(" · ");

          const allCohorts = [
            member.primaryCohort,
            ...(member.secondaryCohorts || []),
          ].filter(Boolean);
          const visibleTags = member.domainTags.slice(0, 3 - Math.min(allCohorts.length, 2));
          const remainingCount = member.domainTags.length - visibleTags.length;

          return (
            <article className={`member-directory-profile-card tone-${tone}`} key={member.id}>
              {isSelf ? (
                <span className="member-directory-you-chip">YOU</span>
              ) : null}

              <div className="member-directory-identity-row">
                <div className={`member-directory-avatar tone-${tone}`}>
                  {member.headshotSrc ? (
                    <img
                      alt={`${member.displayNameLabel || member.displayName} headshot`}
                      className="member-headshot-image"
                      src={member.headshotSrc}
                    />
                  ) : (
                    <span>{getInitials(member.displayNameLabel || member.displayName)}</span>
                  )}
                </div>

                <div className="member-directory-copy">
                  <strong className="member-directory-name">
                    {member.displayNameLabel || member.displayName}
                  </strong>
                  <p className={`member-directory-role-line${roleLabel ? "" : " is-placeholder"}`}>
                    {roleLabel || "Role pending"}
                  </p>
                  <p className={`member-directory-organisation-line${organisationLine ? "" : " is-placeholder"}`}>
                    {organisationLine || "Organisation pending"}
                  </p>
                </div>
              </div>

              {allCohorts.length || member.domainTags.length ? (
                <div className="member-directory-tag-row member-directory-tag-row-secondary">
                  {allCohorts.map((cohort) => (
                    <span
                      className={`status-chip member-directory-cohort-chip tone-${getCohortTone(cohort.slug)}`}
                      key={cohort.slug}
                    >
                      {cohort.name}
                    </span>
                  ))}
                  {visibleTags.map((tag) => (
                    <span className="status-chip chip-neutral" key={tag.slug}>
                      {tag.name}
                    </span>
                  ))}
                  {remainingCount > 0 ? (
                    <span className="status-chip chip-muted">+{remainingCount}</span>
                  ) : null}
                </div>
              ) : null}

              <p className="member-directory-excerpt">{getBioExcerpt(member)}</p>

              <div className="member-directory-card-footer">
                <span className="member-directory-footer-note">{getSpaceCountLabel(member.spaceCount || 0)}</span>
                {isSelf ? (
                  <Link className="member-directory-card-button" href="/app/profile">
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    className="member-directory-card-button"
                    disabled
                    title="Coming soon"
                    type="button"
                  >
                    Contact
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
