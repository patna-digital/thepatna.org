import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSpaceTags } from "@/lib/spaces";
import { SpaceForm } from "../components/space-form";
import { createSpaceAction } from "../[spaceId]/actions";

export default async function NewSpacePage() {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { tags } = await fetchSpaceTags({ supabase: adminClient });

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Create space",
        title: "Add a new community space",
        body: "Create a cohort room, constituency, or working group. Set visibility and tags to control access and discoverability.",
      }}
      subtitle="Set up a new space for PATNA members to coordinate, share, and collaborate."
      title="New space"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <SpaceForm
            action={createSpaceAction}
            cancelHref="/admin/spaces"
            submitLabel="Create space"
            tags={tags}
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Space types</h3>
            <dl className="compact-list">
              <dt>Working Group</dt>
              <dd>Focused taskforce or drafting group tied to a specific deliverable or process</dd>
              <dt>Cohort</dt>
              <dd>Primary coordination room for a PATNA cohort (Policy, Academic, etc.)</dd>
              <dt>Constituency</dt>
              <dd>Cross-cohort affinity or negotiating bloc (e.g. SIDS, LDCs)</dd>
              <dt>Geography</dt>
              <dd>Regional or national cluster coordination</dd>
            </dl>
          </div>

          <div className="dashboard-card">
            <h3>Visibility</h3>
            <dl className="compact-list">
              <dt>All members</dt>
              <dd>Visible and accessible to every active PATNA member</dd>
              <dt>Invite only</dt>
              <dd>Only members explicitly added can access this space</dd>
              <dt>Private</dt>
              <dd>Hidden from directory; admin-managed membership</dd>
            </dl>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
