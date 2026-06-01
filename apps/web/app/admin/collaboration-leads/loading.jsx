export default function AdminCollaborationLeadsLoading() {
  return (
    <div className="dashboard-content" aria-busy="true" aria-label="Loading collaboration leads">
      <div className="summary-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="summary-tile">
            <span className="skeleton-block" style={{ height: 28, width: 40, display: "block", marginBottom: 6 }} />
            <span className="skeleton-block" style={{ height: 12, width: 80, display: "block" }} />
          </div>
        ))}
      </div>

      <article className="dashboard-card">
        <div className="stack">
          <div className="skeleton-toolbar">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-tab" />
            ))}
            <div className="skeleton-search" />
          </div>
          <SkeletonTable cols={7} rows={8} widths={[140, 120, 100, 90, 100, 90, 60]} />
        </div>
      </article>
    </div>
  );
}

function SkeletonTable({ cols, rows, widths }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-table-head">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-cell" style={{ width: widths?.[i] ?? 80, flexShrink: 0 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-row">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="skeleton-cell"
              style={{
                width: widths?.[i] ?? 80,
                flexShrink: 0,
                animationDelay: `${(r * cols + i) * 30}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
