"use client";

export function ArchiveSearchInput({
  label = "Search archive",
  value,
  onChange,
  placeholder = "Search",
  clearLabel = "Clear",
}) {
  return (
    <div className="archive-search-shell">
      {label && (
        <label className="archive-search-label" htmlFor="archive-search-input">
          {label}
        </label>
      )}
      <div className="archive-search-control">
        <span aria-hidden="true" className="archive-search-icon">
          ⌕
        </span>
        <input
          className="archive-search-input"
          id="archive-search-input"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        {value ? (
          <button
            className="archive-search-clear"
            onClick={() => onChange("")}
            type="button"
          >
            {clearLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
