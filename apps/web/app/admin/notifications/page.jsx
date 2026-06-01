import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminNavWithPipelineBadges } from "@/lib/admin-pipeline-badges";
import { AdminNotificationsClient } from "./components/admin-notifications-client";
import { sendBroadcastAction } from "./actions";

export default async function AdminNotificationsPage({ searchParams }) {
  const { supabase } = await requireAdminContext();
  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";

  const adminClient = createSupabaseAdminClient();

  const [broadcasts, cohorts, navItems] = await Promise.all([
    // Fetch last 50 broadcasts, newest first
    adminClient
      .from("admin_broadcasts")
      .select("*, sender:sender_id(first_name, surname)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => data ?? []),

    // Fetch cohorts with member counts for the composer
    adminClient
      .from("cohorts")
      .select("id, name, user_cohorts(count)")
      .order("name")
      .then(({ data }) =>
        (data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          memberCount: c.user_cohorts?.[0]?.count ?? 0,
        }))
      ),

    getAdminNavWithPipelineBadges(supabase),
  ]);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin"
      navItems={navItems}
      subtitle="Compose and send announcements to community members. In-app and email delivery."
      title="Notifications"
    >
      <AdminNotificationsClient
        broadcasts={broadcasts}
        cohorts={cohorts}
        notice={notice}
        sendAction={sendBroadcastAction}
      />
    </DashboardShell>
  );
}
