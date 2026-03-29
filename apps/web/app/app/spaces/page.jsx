import { DashboardShell } from "@/components/dashboard-shell";
import { memberSpaces } from "@/lib/patna-data";

export default function SpacesPage() {
  return (
    <DashboardShell
      title="Spaces"
      subtitle="Cohort, constituency, and working-group spaces will map directly onto the `spaces` and `space_memberships` tables."
    >
      <article className="dashboard-card">
        <h3>Visible spaces</h3>
        <div className="stack">
          {memberSpaces.map((space) => (
            <div className="list-row" key={space.slug}>
              <div>
                <strong>{space.name}</strong>
                <p>{space.type}</p>
              </div>
              <div className="item-meta">
                <span>{space.members} members</span>
                <span>{space.threads} threads</span>
                <span>{space.role}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </DashboardShell>
  );
}
