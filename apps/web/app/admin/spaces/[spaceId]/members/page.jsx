import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchPendingSpaceJoinRequests,
  fetchSpaceById,
  fetchSpaceMembers,
  SPACE_MEMBER_ROLES,
  formatSpaceType,
} from "@/lib/spaces";
import { SpaceMembersClient } from "./members-client";
import {
  addSpaceMemberAction,
  approveSpaceJoinRequestAction,
  updateMemberRoleAction,
  removeSpaceMemberAction,
} from "./actions";

export default async function SpaceMembersPage({ params }) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const { spaceId } = await params;

  const [{ space, error: spaceError }, { members }, { requests: joinRequests }] = await Promise.all([
    fetchSpaceById({ supabase: adminClient, id: spaceId }),
    fetchSpaceMembers({ supabase: adminClient, spaceId }),
    fetchPendingSpaceJoinRequests({ adminSupabase: adminClient, spaceId }),
  ]);

  if (spaceError || !space) {
    notFound();
  }

  // Fetch all active profiles for the add-member selector
  const { data: allProfiles } = await adminClient
    .from("profiles")
    .select("id, first_name, surname, email, organisation_name")
    .eq("profile_status", "active")
    .order("surname", { ascending: true });

  const memberUserIds = new Set(members.map((m) => m.profile?.id).filter(Boolean));
  const eligibleProfiles = (allProfiles || []).filter((p) => !memberUserIds.has(p.id));

  async function handleAdd(formData) {
    "use server";
    return addSpaceMemberAction(spaceId, formData);
  }

  async function handleUpdateRole(formData) {
    "use server";
    return updateMemberRoleAction(spaceId, formData);
  }

  async function handleRemove(userId) {
    "use server";
    return removeSpaceMemberAction(spaceId, userId);
  }

  async function handleApproveJoinRequest(formData) {
    "use server";
    return approveSpaceJoinRequestAction(spaceId, formData);
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Space membership",
        title: space.name,
        body: `Manage who can access this ${formatSpaceType(space.space_type).toLowerCase()} and their roles.`,
      }}
      subtitle={`${members.length} ${members.length === 1 ? "member" : "members"} · ${formatSpaceType(space.space_type)}`}
      title="Manage members"
    >
      <SpaceMembersClient
        eligibleProfiles={eligibleProfiles}
        handleAdd={handleAdd}
        handleApproveJoinRequest={handleApproveJoinRequest}
        handleRemove={handleRemove}
        handleUpdateRole={handleUpdateRole}
        joinRequests={joinRequests}
        members={members}
        roles={SPACE_MEMBER_ROLES}
        spaceId={spaceId}
        spaceName={space.name}
      />
    </DashboardShell>
  );
}
