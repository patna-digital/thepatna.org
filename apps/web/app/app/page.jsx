import { DashboardShell } from "@/components/dashboard-shell";
import {
  dashboardEvents,
  memberApplications,
  memberHighlights,
  memberSpaces,
} from "@/lib/patna-data";

export default function MemberDashboardPage() {
  return (
    <DashboardShell
      eyebrow="PATNA Community"
      spotlight={{
        label: "Active focus",
        title: "Applications and cohort coordination",
        body: "The dashboard is now visually aligned with the original mockup and can scale into richer discussions, events, and review surfaces.",
      }}
      title="Community dashboard"
      subtitle="Your spaces, discussions, applications, and upcoming coordination moments now sit inside a PATNA-specific dashboard shell modeled on the original community mockup."
    >
      <div className="summary-grid">
        <div className="summary-tile">
          <strong>4</strong>
          <span>Visible spaces</span>
        </div>
        <div className="summary-tile">
          <strong>7</strong>
          <span>Unread discussions</span>
        </div>
        <div className="summary-tile">
          <strong>4</strong>
          <span>Active applications</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>My spaces</h3>
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
                  <span>{space.unread} unread</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h3>Upcoming events</h3>
          <div className="stack">
            {dashboardEvents.map((item) => (
              <div className="list-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.location}</p>
                </div>
                <div className="item-meta">
                  <span>{item.date}</span>
                  <span>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="dashboard-card">
        <h3>Recent discussion activity</h3>
        <div className="stack">
          {memberHighlights.map((item) => (
            <div className="list-row" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.space}</p>
              </div>
              <div className="item-meta">
                <span>{item.time}</span>
                <span>{item.replies} replies</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="dashboard-card">
        <h3>Community applications</h3>
        <div className="table-like">
          {memberApplications.map((application) => (
            <div className="table-row" key={application.name}>
              <div>
                <strong>{application.name}</strong>
                <p>{application.organisation}</p>
              </div>
              <div>
                <strong>{application.country}</strong>
                <p>Community applicant</p>
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
