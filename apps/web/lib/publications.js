import {
  canUseSupabaseAdmin,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";

const PUBLICATION_SELECT = `
  *,
  content_attachments(*),
  content_tag_map(domain_tags(id, name, slug))
`;

function normalisePublication(item) {
  return {
    ...item,
    attachments: item.content_attachments || [],
    tags: item.content_tag_map?.map((tagRow) => tagRow.domain_tags).filter(Boolean) || [],
  };
}

export async function fetchPublicPublications({ limit = 0 } = {}) {
  if (!canUseSupabaseAdmin()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("content_items")
    .select(PUBLICATION_SELECT)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch public publications:", error);
    return [];
  }

  return (data || []).map(normalisePublication);
}

export async function fetchPublicPublicationBySlug(slug) {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(PUBLICATION_SELECT)
    .eq("slug", slug)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalisePublication(data);
}
