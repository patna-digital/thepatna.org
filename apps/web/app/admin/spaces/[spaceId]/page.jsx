import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSpaceById, fetchSpaceTags, formatSpaceType } from "@/lib/spaces";
import { SpaceForm } from "../components/space-form";
import { updateSpaceAction } from "./actions";

export default async function EditSpacePage({ params }) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const { spaceId } = await params;

  const [{ space, error: spaceError }, { tags }] = await Promise.all([
    fetchSpaceById({ supabase: adminClient, id: spaceId }),
    fetchSpaceTags({ supabase: adminClient }),
  ]);

  if (spaceError || !space) {
    notFound();
  }

  async function handleUpdate(formData) {
    "use server";
    return updateSpaceAction(space.id, formData);
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Edit space",
        title: space.name,
        body: `Update settings and tags for this ${formatSpaceType(space.space_type).toLowerCase()}.`,
      }}
      subtitle={`Edit space details, visibility, and tags. Use Manage members to update membership.`}
      title="Edit space"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <SpaceForm
            action={handleUpdate}
            cancelHref="/admin/spaces"
            space={space}
            submitLabel="Save changes"
            tags={tags}
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Space details</h3>
            <div className="insight-meta-list">
              <div className="insight-meta-item">
                <span className="insight-meta-label">ID</span>
                <span className="insight-meta-value">{space.id.slice(0, 8)}…</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Slug</span>
                <span className="insight-meta-value">{space.slug}</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Type</span>
                <span className="insight-meta-value">{formatSpaceType(space.space_type)}</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Members</span>
                <span className="insight-meta-value">{space.members?.length ?? 0}</span>
              </div>
              <div className="insight-meta-item">
                <span className="insight-meta-label">Created</span>
                <span className="insight-meta-value">{formatDate(space.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Quick links</h3>
            <div className="content-meta stack" style={{ gap: "0.5rem" }}>
              <Link className="text-link" href={`/admin/spaces/${space.id}/members`}>
                Manage members →
              </Link>
              <Link className="text-link" href="/admin/spaces">
                ← Back to all spaces
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
