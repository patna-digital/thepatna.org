import { adminNav } from "@/lib/patna-data";

export async function getAdminNavWithPipelineBadges(supabase) {
  try {
    const [serviceResult, partnershipResult, collaborationResult, needsReviewResult] = await Promise.all([
      supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("partnership_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("collaboration_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("needs_review", true),
    ]);

    const newLeadsCount =
      (serviceResult.count || 0) +
      (partnershipResult.count || 0) +
      (collaborationResult.count || 0);

    const counts = {
      "/admin/leads": newLeadsCount,
      "/admin/insights": needsReviewResult.count || 0,
    };

    return adminNav.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        const count = counts[item.href];
        if (count > 0) {
          return { ...item, badge: count };
        }
        return item;
      }),
    }));
  } catch {
    return adminNav;
  }
}
