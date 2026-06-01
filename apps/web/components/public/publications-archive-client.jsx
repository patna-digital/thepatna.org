"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArchiveSearchInput } from "@/components/public/archive-search-input";
import { PublicationArchiveCard } from "@/components/public/publication-archive-card";

const PAGE_SIZE = 4;

function matchesPub(pub, query) {
  const haystack = [
    pub.title,
    pub.summary,
    pub.contentTypeLabel,
    pub.content_type,
    ...(pub.tags || []).map((t) => t.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function pubYear(pub) {
  return pub.published_at ? new Date(pub.published_at).getFullYear() : null;
}

export function PublicationsArchiveClient({ publications, labels = {} }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const { pubTypes, pubYears } = useMemo(() => {
    const types = new Set(
      publications.map((p) => p.contentTypeLabel || p.content_type).filter(Boolean)
    );
    const years = new Set(publications.map(pubYear).filter(Boolean));
    return {
      pubTypes: [...types].sort(),
      pubYears: [...years].sort((a, b) => b - a),
    };
  }, [publications]);

  const filtered = useMemo(() => {
    let results = publications.filter((pub) => {
      if (normalizedQuery && !matchesPub(pub, normalizedQuery)) return false;
      if (typeFilter && (pub.contentTypeLabel || pub.content_type) !== typeFilter) return false;
      if (yearFilter && String(pubYear(pub)) !== yearFilter) return false;
      return true;
    });

    if (sortBy === "newest") {
      results = [...results].sort((a, b) => {
        if (!a.published_at) return 1;
        if (!b.published_at) return -1;
        return new Date(b.published_at) - new Date(a.published_at);
      });
    } else if (sortBy === "oldest") {
      results = [...results].sort((a, b) => {
        if (!a.published_at) return 1;
        if (!b.published_at) return -1;
        return new Date(a.published_at) - new Date(b.published_at);
      });
    } else if (sortBy === "az") {
      results = [...results].sort((a, b) => a.title.localeCompare(b.title));
    }

    return results;
  }, [publications, normalizedQuery, typeFilter, yearFilter, sortBy]);

  function resetCount(setter) {
    return (value) => {
      setter(value);
      setVisibleCount(PAGE_SIZE);
    };
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const remaining = filtered.length - visibleCount;
  const isFiltered = !!normalizedQuery || !!typeFilter || !!yearFilter;

  return (
    <div className="events-archive-shell">
      {/* ── Toolbar ── */}
      <div className="events-toolbar">
        <ArchiveSearchInput
          clearLabel="Clear"
          label={null}
          onChange={(v) => { setQuery(v); setVisibleCount(PAGE_SIZE); }}
          placeholder="Search by title, type, or theme…"
          value={query}
        />

        <div className="events-toolbar-filters">
          <select
            aria-label="Filter by type"
            className="events-filter-select"
            value={typeFilter}
            onChange={(e) => resetCount(setTypeFilter)(e.target.value)}
          >
            <option value="">All types</option>
            {pubTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            aria-label="Filter by year"
            className="events-filter-select"
            value={yearFilter}
            onChange={(e) => resetCount(setYearFilter)(e.target.value)}
          >
            <option value="">All years</option>
            {pubYears.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>

          <select
            aria-label="Sort publications"
            className="events-filter-select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(PAGE_SIZE); }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
          </select>

          <span className="events-result-count">
            {filtered.length} publication{filtered.length !== 1 ? "s" : ""}
            {isFiltered ? " found" : ""}
          </span>
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length > 0 ? (
        <>
          <div className="publications-grid events-archive-grid">
            {visible.map((pub) => (
              <PublicationArchiveCard
                key={pub.id}
                labels={labels}
                publication={pub}
              />
            ))}
          </div>

          {hasMore && (
            <div className="events-show-more-row">
              <button
                className="events-show-more-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Show more publications
                <span className="events-show-more-count">{remaining} remaining</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <article className="archive-empty-state">
          <h3>No publications found</h3>
          <p>
            {isFiltered
              ? "Try adjusting your search or filters."
              : "No publications have been released yet."}
          </p>
        </article>
      )}
    </div>
  );
}
