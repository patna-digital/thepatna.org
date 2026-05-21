import { Globe } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { FeaturedMembersPicker } from "./components/featured-members-picker";

async function fetchSettingsData() {
  const adminClient = createSupabaseAdminClient();

  const [settingsResult, membersResult] = await Promise.all([
    adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "home_featured_members")
      .single(),
    adminClient
      .from("profiles")
      .select("id, first_name, surname, title, role_title, organisation_name")
      .eq("onboarding_status", "active")
      .eq("profile_status", "active")
      .order("first_name", { ascending: true }),
  ]);

  const setting = settingsResult.data?.value || { mode: "default", member_ids: [] };

  const [cohortResult] = await Promise.all([
    adminClient
      .from("user_cohorts")
      .select("user_id, cohorts(name)")
      .in("user_id", (membersResult.data || []).map((p) => p.id))
      .eq("is_primary", true),
  ]);

  const cohortByUser = new Map(
    (cohortResult.data || []).map((row) => [row.user_id, row.cohorts?.name || ""])
  );

  const allMembers = (membersResult.data || []).map((p) => ({
    id: p.id,
    name: [p.title, p.first_name, p.surname].filter(Boolean).join(" ") || "PATNA Member",
    org: p.organisation_name || "",
    cohort: cohortByUser.get(p.id) || "",
  }));

  return { setting, allMembers };
}

export default async function AdminSettingsPage() {
  await requireAdminContext();
  const { setting, allMembers } = await fetchSettingsData();

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Configuration"
      navItems={adminNav}
      title="Website Settings"
      subtitle="Control how content appears on the public-facing website."
    >
      <div className="admin-settings-page">

        <div className="admin-section">
          <div className="admin-section-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div className="admin-section-icon">
                <Globe size={14} />
              </div>
              <div>
                <h3 className="admin-section-title">Community snapshot</h3>
                <p className="admin-section-description">
                  Choose which members are shown in the "Our Community" section on the home page.
                </p>
              </div>
            </div>
          </div>

          <FeaturedMembersPicker
            allMembers={allMembers}
            initialMode={setting.mode}
            initialIds={setting.member_ids || []}
          />
        </div>

      </div>
    </DashboardShell>
  );
}
