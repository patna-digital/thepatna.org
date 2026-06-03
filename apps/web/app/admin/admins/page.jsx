import { AdminAdminsList } from "@/components/admin-admins-list";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getNoticeMessage(notice) {
  const messages = {
    granted: "Admin access granted.",
    revoked: "Admin access removed.",
    invited: "Invitation sent. Admin access will be granted as soon as they complete account setup.",
    "invite-failed": "Could not send an invitation to that email address. It may already be registered.",
    "not-found": "No PATNA account found for that email address.",
    "already-admin": "That user is already an admin.",
    "cannot-remove-self": "You cannot remove your own admin access.",
    "cannot-remove-super-admin": "The super admin cannot be removed.",
    "missing-fields": "Email address is required.",
    error: "Something went wrong. Please try again.",
  };
  return messages[notice] || "";
}

export default async function AdminAdminsPage({ searchParams }) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = currentProfile?.is_super_admin ?? false;

  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  // Fetch all users with the administrator role, joined with their profiles
  const { data: adminRoles } = await adminClient
    .from("user_roles")
    .select("user_id, created_at, profiles(first_name, surname, email, role_title, is_super_admin)")
    .eq("role", "administrator")
    .order("created_at", { ascending: true });

  const admins = (adminRoles || []).map((row) => ({
    user_id: row.user_id,
    granted_at: row.created_at,
    first_name: row.profiles?.first_name ?? null,
    surname: row.profiles?.surname ?? null,
    email: row.profiles?.email ?? "—",
    role_title: row.profiles?.role_title ?? null,
    is_super_admin: row.profiles?.is_super_admin ?? false,
  }));

  const noticeMessage = getNoticeMessage(notice);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Settings",
        title: "Admin access",
        body: isSuperAdmin
          ? "Grant or remove administrator access. The super admin account cannot be modified."
          : "View all administrators. Only the super admin can grant or remove access.",
      }}
      title="Admins"
      subtitle="Manage who has administrator access to the PATNA portal."
    >
      {noticeMessage && (
        <div className={`notice-banner ${["granted", "revoked", "invited"].includes(notice) ? "notice-success" : "notice-error"}`}>
          {noticeMessage}
        </div>
      )}

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <strong>{admins.length}</strong>
          <h4>Total admins</h4>
          <p>With portal access</p>
        </div>
        <div className="admin-stat-card tone-warning">
          <strong>{admins.filter((a) => a.is_super_admin).length}</strong>
          <h4>Super admin</h4>
          <p>Full control</p>
        </div>
      </div>

      <AdminAdminsList admins={admins} currentUserId={user.id} isSuperAdmin={isSuperAdmin} />
    </DashboardShell>
  );
}
