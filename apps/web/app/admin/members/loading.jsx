export default function AdminMembersLoading() {
  return (
    <div className="dashboard-content" aria-busy="true" aria-label="Loading members">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-tab" />
            ))}
            <div className="skeleton-search" />
          </div>
          {Array.from({ length: 10 }).map((_, r) => (
            <div key={r} className="skeleton-row" style={{ animationDelay: `${r * 50}ms` }}>
              <div className="skeleton-cell" style={{ width: 20, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-cell" style={{ width: "60%", marginBottom: 6 }} />
                <div className="skeleton-cell" style={{ width: "35%", height: 10 }} />
              </div>
              <div className="skeleton-cell" style={{ width: 80, flexShrink: 0 }} />
              <div className="skeleton-cell" style={{ width: 60, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
