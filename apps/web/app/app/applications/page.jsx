import { DashboardShell } from "@/components/dashboard-shell";
import { memberApplications } from "@/lib/patna-data";

export default function ApplicationsPage() {
  return (
    <DashboardShell
      title="Applications"
      subtitle="The staged application workflow is represented in the schema as community applications, invite records, and admin review fields."
    >
      <article className="dashboard-card">
        <h3>Current applications</h3>
        <div className="table-like">
          {memberApplications.map((application) => (
            <div className="table-row" key={application.name}>
              <div>
                <strong>{application.name}</strong>
                <p>{application.organisation}</p>
              </div>
              <div>
                <strong>{application.country}</strong>
                <p>Pending review flow</p>
              </div>
              <div>
                <span className="status-chip">{application.status}</span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </DashboardShell>
  );
}
