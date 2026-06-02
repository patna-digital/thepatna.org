import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WipPageGuard } from "@/components/wip-page-guard";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getWipPages() {
  if (!canUseSupabaseAdmin()) return [];
  try {
    const adminClient = createSupabaseAdminClient();
    const { data } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "wip_pages")
      .single();
    return data?.value?.pages || [];
  } catch {
    return [];
  }
}

export default async function MarketingLayout({ children }) {
  const wipPages = await getWipPages();
  return (
    <div className="page-shell marketing-shell">
      <SiteHeader />
      <WipPageGuard wipPages={wipPages}>
        <main className="marketing-main">{children}</main>
      </WipPageGuard>
      <SiteFooter />
    </div>
  );
}
