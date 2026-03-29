import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Account settings will later include password reset, notifications, and profile visibility controls backed by Supabase Auth and the `profiles` table."
    >
      <article className="dashboard-card">
        <h3>Initial settings surface</h3>
        <ul className="check-list">
          <li>Profile visibility settings</li>
          <li>Password reset and invite completion status</li>
          <li>Notification preferences</li>
          <li>Connected cohort and space membership summary</li>
        </ul>
      </article>
    </DashboardShell>
  );
}
