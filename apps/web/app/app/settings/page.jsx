import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";

function formatVisibility(value) {
  return String(value || "members_only").replaceAll("_", " ");
}

export default async function SettingsPage() {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/settings");
  }

  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });

  if (frameData.error || !frameData.member) {
    redirect("/app/profile");
  }

  const member = frameData.member;

  return (
    <MemberWorkspaceShell
      eyebrow="Workspace"
      sidebarUser={frameData.sidebarUser}
      subtitle="Current settings are organized around the fields PATNA already stores, with future account controls clearly separated."
      title="Settings"
    >
      <div className="member-dashboard-stack">
        <div className="card-grid member-settings-grid">
          <article className="dashboard-card member-setting-card">
            <span className="tag">Live</span>
            <h3>Profile visibility</h3>
            <p>Current directory visibility is derived from your stored profile settings.</p>
            <div className="member-setting-value">{formatVisibility(member.visibility_setting)}</div>
          </article>

          <article className="dashboard-card member-setting-card">
            <span className="tag">Live</span>
            <h3>Account state</h3>
            <p>Your onboarding, visibility, and member status are reflected here from your current PATNA profile.</p>
            <div className="member-setting-list">
              <span>Onboarding: {member.onboarding_status}</span>
              <span>Profile: {member.profileStatus}</span>
              <span>Availability: {member.availabilityStatus}</span>
            </div>
          </article>

          <article className="dashboard-card member-setting-card">
            <span className="tag">Live</span>
            <h3>Community context</h3>
            <p>Current role and cohort placement based on your member profile.</p>
            <div className="member-setting-list">
              <span>{member.role_title || "Role pending"}</span>
              <span>{member.organisation_name || "Organisation pending"}</span>
              <span>{member.primaryCohort?.name || "Cohort pending"}</span>
            </div>
          </article>

          <article className="dashboard-card member-setting-card member-setting-card-muted">
            <span className="tag">Upcoming</span>
            <h3>Notifications</h3>
            <p>Email, digest, and discussion alert preferences will appear here as member messaging controls are added.</p>
          </article>

          <article className="dashboard-card member-setting-card member-setting-card-muted">
            <span className="tag">Upcoming</span>
            <h3>Password and sign-in</h3>
            <p>Password reset, invite completion, and account security controls will live here once they are exposed in the member workspace.</p>
          </article>
        </div>
      </div>
    </MemberWorkspaceShell>
  );
}
