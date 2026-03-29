import { DashboardShell } from "@/components/dashboard-shell";
import { publicInsights } from "@/lib/patna-data";

export default function MemberInsightsPage() {
  return (
    <DashboardShell
      title="Member insights library"
      subtitle="The same content model can later expose public and member-only items through visibility rules."
    >
      <div className="card-grid">
        {publicInsights.map((item) => (
          <article className="dashboard-card" key={item.slug}>
            <div className="tag">{item.type}</div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="content-meta">
              <span>{item.date}</span>
              <span>{item.audience}</span>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
