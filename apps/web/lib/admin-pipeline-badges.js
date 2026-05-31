import { adminNav } from "@/lib/patna-data";

export async function getAdminNavWithPipelineBadges(supabase) {
  try {
    const [serviceResult, partnershipResult, collaborationResult] = await Promise.all([
      supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("partnership_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("collaboration_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

    const counts = {
      "/admin/service-requests": serviceResult.count || 0,
      "/admin/partnership-leads": partnershipResult.count || 0,
      "/admin/collaboration-leads": collaborationResult.count || 0,
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
