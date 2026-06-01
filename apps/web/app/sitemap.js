import { getSiteUrl } from "@/lib/env";
import {
  canUseSupabaseAdmin,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const staticRoutes = [
    "",
    "/about",
    "/community",
    "/contact",
    "/events",
    "/insights",
    "/projects",
    "/publications",
    "/work-with-us",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  if (!canUseSupabaseAdmin()) {
    return staticRoutes;
  }

  const supabase = createSupabaseAdminClient();
  const { data: bookingPages, error } = await supabase
    .from("booking_settings")
    .select("public_booking_url_slug, updated_at")
    .eq("public_booking_enabled", true)
    .not("public_booking_url_slug", "is", null);

  if (error) {
    return staticRoutes;
  }

  const bookingRoutes = (bookingPages || []).map((page) => ({
    url: `${siteUrl}/book/${page.public_booking_url_slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
  }));

  return [...staticRoutes, ...bookingRoutes];
}
