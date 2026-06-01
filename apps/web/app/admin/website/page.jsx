import Link from "next/link";
import { Users, Star, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { FeaturedMembersPicker } from "@/app/admin/settings/components/featured-members-picker";
import { FeaturedPartnersPicker } from "./components/featured-partners-picker";
import { CollapsibleSection } from "./components/collapsible-section";
import { InlinePeopleManager } from "./components/inline-people-manager";

export const metadata = { title: "Website | PATNA Admin" };

async function fetchPageData() {
  const adminClient = createSupabaseAdminClient();

  const [settingsResult, membersResult, partnersResult, peopleResult] = await Promise.all([
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
    adminClient
      .from("partners")
      .select("id, name, partnership_type, is_featured")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    adminClient
      .from("people_profiles")
      .select("id, section, full_name, title, organisation, email, linkedin_url, photo_url, display_order, is_active")
      .order("section")
      .order("display_order"),
  ]);

  const setting   = settingsResult.data?.value || { mode: "default", member_ids: [] };
  const dbMissing = settingsResult.error?.code === "PGRST205";

  const cohortResult = await adminClient
    .from("user_cohorts")
    .select("user_id, cohorts(name)")
    .in("user_id", (membersResult.data || []).map((p) => p.id))
    .eq("is_primary", true);

  const cohortByUser = new Map(
    (cohortResult.data || []).map((row) => [row.user_id, row.cohorts?.name || ""])
  );

  const allMembers = (membersResult.data || []).map((p) => ({
    id:     p.id,
    name:   [p.title, p.first_name, p.surname].filter(Boolean).join(" ") || "PATNA Member",
    org:    p.organisation_name || "",
    cohort: cohortByUser.get(p.id) || "",
  }));

  const people = peopleResult.data || [];
  const peopleCounts = { board: 0, secretariat: 0, research: 0, visible: 0 };
  people.forEach((p) => {
    if (peopleCounts[p.section] !== undefined) peopleCounts[p.section]++;
    if (p.is_active) peopleCounts.visible++;
  });

  const featuredPartners = (partnersResult.data || []).filter((p) => p.is_featured).length;

  return {
    setting,
    allMembers,
    dbMissing,
    partners: partnersResult.data || [],
    people,
    peopleCounts,
    featuredPartners,
    featuredMembersMode: setting.mode,
  };
}

export default async function AdminWebsitePage() {
  await requireAdminContext();
  const [t, { setting, allMembers, dbMissing, partners, people, peopleCounts, featuredPartners, featuredMembersMode }] = await Promise.all([
    getTranslations(),
    fetchPageData(),
  ]);

  const memberMode = featuredMembersMode === "custom"
    ? t("admin.website.communitySnapshot.modeCustom", { count: setting.member_ids?.length || 0 })
    : t("admin.website.communitySnapshot.modeAuto");

  const peopleTotal = peopleCounts.board + peopleCounts.secretariat + peopleCounts.research;

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel={t("admin.brandLabel")}
      eyebrow={t("admin.website.eyebrow")}
      breadcrumb={[
        { label: t("admin.title"), href: "/admin" },
        { label: t("admin.website.breadcrumb.parent") },
        { label: t("admin.website.breadcrumb.self") },
      ]}
      navItems={adminNav}
      title={t("admin.website.title")}
      subtitle={t("admin.website.subtitle")}
    >
      <div className="admin-settings-page">
        {dbMissing && (
          <div className="form-feedback-banner error" role="alert" style={{ marginBottom: "1.5rem" }}>
            <strong>{t("admin.website.dbMissing.title")}</strong> {t("admin.website.dbMissing.text")}
          </div>
        )}

        {/* ── Community Snapshot ─────────────────────────────────── */}
        <CollapsibleSection
          icon={<Globe size={14} />}
          title={t("admin.website.communitySnapshot.title")}
          description={t("admin.website.communitySnapshot.description")}
          summary={memberMode}
        >
          <FeaturedMembersPicker
            allMembers={allMembers}
            initialMode={setting.mode}
            initialIds={setting.member_ids || []}
          />
        </CollapsibleSection>

        {/* ── Featured Partners ───────────────────────────────────── */}
        <div style={{ marginTop: "0.75rem" }}>
          <CollapsibleSection
            icon={<Star size={14} />}
            title={t("admin.website.featuredPartners.title")}
            description={t("admin.website.featuredPartners.description")}
            summary={t("admin.website.featuredPartners.summary", { count: featuredPartners })}
          >
            <FeaturedPartnersPicker partners={partners} />
          </CollapsibleSection>
        </div>

        {/* ── People ─────────────────────────────────────────────── */}
        <div style={{ marginTop: "0.75rem" }}>
          <CollapsibleSection
            icon={<Users size={14} />}
            title={t("admin.website.people.title")}
            description={t("admin.website.people.description")}
            summary={t("admin.website.people.summary", { visible: peopleCounts.visible, total: peopleTotal })}
            badge={peopleTotal}
          >
            <InlinePeopleManager people={people} peopleCounts={peopleCounts} />
          </CollapsibleSection>
        </div>
      </div>
    </DashboardShell>
  );
}
