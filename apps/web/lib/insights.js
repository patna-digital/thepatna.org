import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Valid content types for insights
export const INSIGHT_CONTENT_TYPES = [
  { value: "report", label: "Report" },
  { value: "brief", label: "Brief" },
  { value: "case_study", label: "Case Study" },
  { value: "article", label: "Article" },
  { value: "workshop_proceedings", label: "Workshop Proceedings" },
];

// Valid publish statuses
export const INSIGHT_STATUSES = [
  { value: "draft", label: "Draft", color: "warning" },
  { value: "published", label: "Published", color: "success" },
  { value: "archived", label: "Archived", color: "muted" },
];

// Valid visibility levels
export const INSIGHT_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "members", label: "Members only" },
  { value: "restricted", label: "Restricted" },
];

/**
 * Fetch insights for admin interface (all statuses)
 */
export async function fetchAdminInsights({ supabase, filters = {} }) {
  const { status = "all", type = "all", search = "" } = filters;

  let query = supabase
    .from("content_items")
    .select(`
      *,
      creator:created_by_user_id(email, first_name, surname),
      updater:updated_by_user_id(email, first_name, surname)
    `)
    .order("updated_at", { ascending: false });

  // Apply status filter
  if (status && status !== "all") {
    query = query.eq("publish_status", status);
  }

  // Apply type filter
  if (type && type !== "all") {
    query = query.eq("content_type", type);
  }

  // Apply search
  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch admin insights:", error);
    return { insights: [], error };
  }

  // Fetch tags and attachments for each insight
  const insightsWithRelations = await Promise.all(
    (data || []).map(async (insight) => {
      const [tagsResult, attachmentsResult] = await Promise.all([
        supabase
          .from("content_tag_map")
          .select("domain_tags(id, name, slug)")
          .eq("content_id", insight.id),
        supabase
          .from("content_attachments")
          .select("*")
          .eq("content_id", insight.id),
      ]);

      return {
        ...insight,
        tags: tagsResult.data?.map((t) => t.domain_tags).filter(Boolean) || [],
        attachments: attachmentsResult.data || [],
      };
    })
  );

  return { insights: insightsWithRelations, error: null };
}

/**
 * Fetch insights for member interface (published only)
 */
export async function fetchMemberInsights({ supabase, filters = {} }) {
  const { type = "all", tag = "all", search = "" } = filters;

  let query = supabase
    .from("content_items")
    .select(`
      *,
      content_tag_map(domain_tags(id, name, slug)),
      content_attachments(*)
    `)
    .eq("publish_status", "published")
    .in("visibility", ["public", "members"])
    .order("published_at", { ascending: false });

  // Apply type filter
  if (type && type !== "all") {
    query = query.eq("content_type", type);
  }

  // Apply tag filter
  if (tag && tag !== "all") {
    query = query.filter("content_tag_map.domain_tags.slug", "eq", tag);
  }

  // Apply search
  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch member insights:", error);
    return { insights: [], error };
  }

  // Transform data
  const insights = (data || []).map((item) => ({
    ...item,
    tags: item.content_tag_map?.map((t) => t.domain_tags).filter(Boolean) || [],
    attachments: item.content_attachments || [],
  }));

  return { insights, error: null };
}

/**
 * Fetch single insight by slug
 */
export async function fetchInsightBySlug({ supabase, slug, includeUnpublished = false }) {
  let query = supabase
    .from("content_items")
    .select(`
      *,
      creator:created_by_user_id(email, first_name, surname),
      updater:updated_by_user_id(email, first_name, surname),
      content_tag_map(domain_tags(id, name, slug)),
      content_attachments(*)
    `)
    .eq("slug", slug)
    .single();

  const { data, error } = await query;

  if (error) {
    return { insight: null, error };
  }

  // Check visibility for non-admins
  if (!includeUnpublished && data.publish_status !== "published") {
    return { insight: null, error: { message: "Insight not found" } };
  }

  const insight = {
    ...data,
    tags: data.content_tag_map?.map((t) => t.domain_tags).filter(Boolean) || [],
    attachments: data.content_attachments || [],
  };

  return { insight, error: null };
}

/**
 * Create new insight (admin only)
 */
export async function createInsight({ adminSupabase, data, userId }) {
  const {
    title,
    summary,
    body,
    content_type,
    publish_status,
    visibility,
    slug,
    published_at,
    tag_ids = [],
    featured = false,
    cover_image_url = null,
    cover_image_alt = null,
    meta_description = null,
  } = data;

  // Create content item
  const { data: insight, error: insertError } = await adminSupabase
    .from("content_items")
    .insert({
      title,
      summary,
      body,
      content_type,
      publish_status,
      visibility,
      slug,
      featured,
      cover_image_url,
      cover_image_alt,
      meta_description,
      published_at: published_at || (publish_status === "published" ? new Date().toISOString() : null),
      created_by_user_id: userId,
      updated_by_user_id: userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create insight:", insertError);
    return { insight: null, error: insertError };
  }

  // Add tags if provided
  if (tag_ids.length > 0) {
    const { error: tagError } = await adminSupabase
      .from("content_tag_map")
      .insert(tag_ids.map((tag_id) => ({
        content_id: insight.id,
        tag_id,
      })));

    if (tagError) {
      console.error("Failed to add tags:", tagError);
    }
  }

  return { insight, error: null };
}

/**
 * Update existing insight
 */
export async function updateInsight({ adminSupabase, id, data, userId }) {
  const {
    title,
    summary,
    body,
    content_type,
    publish_status,
    visibility,
    published_at,
    tag_ids,
    featured,
    cover_image_url,
    cover_image_alt,
    meta_description,
  } = data;

  // Update content item
  const updateData = {
    title,
    summary,
    body,
    content_type,
    publish_status,
    visibility,
    updated_by_user_id: userId,
    updated_at: new Date().toISOString(),
    ...(featured !== undefined && { featured }),
    ...(cover_image_url !== undefined && { cover_image_url }),
    ...(cover_image_alt !== undefined && { cover_image_alt }),
    ...(meta_description !== undefined && { meta_description }),
  };

  // Set published_at if transitioning to published
  if (published_at) {
    updateData.published_at = published_at;
  } else if (publish_status === "published") {
    // Get current status first
    const { data: current } = await adminSupabase
      .from("content_items")
      .select("publish_status, published_at")
      .eq("id", id)
      .single();
    
    if (current?.publish_status !== "published" || !current?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data: insight, error: updateError } = await adminSupabase
    .from("content_items")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update insight:", updateError);
    return { insight: null, error: updateError };
  }

  // Update tags if provided
  if (tag_ids !== undefined) {
    // Delete existing tags
    await adminSupabase
      .from("content_tag_map")
      .delete()
      .eq("content_id", id);

    // Add new tags
    if (tag_ids.length > 0) {
      const { error: tagError } = await adminSupabase
        .from("content_tag_map")
        .insert(tag_ids.map((tag_id) => ({
          content_id: id,
          tag_id,
        })));

      if (tagError) {
        console.error("Failed to update tags:", tagError);
      }
    }
  }

  return { insight, error: null };
}

/**
 * Delete insight
 */
export async function deleteInsight({ adminSupabase, id }) {
  // Delete attachments first (cascade should handle this, but being explicit)
  await adminSupabase
    .from("content_attachments")
    .delete()
    .eq("content_id", id);

  // Delete tag mappings
  await adminSupabase
    .from("content_tag_map")
    .delete()
    .eq("content_id", id);

  // Delete insight
  const { error } = await adminSupabase
    .from("content_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete insight:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Add attachment to insight
 */
export async function addInsightAttachment({ adminSupabase, content_id, file_url, title, file_type }) {
  const { data, error } = await adminSupabase
    .from("content_attachments")
    .insert({
      content_id,
      file_url,
      title: title || "Attachment",
      file_type: file_type || "application/pdf",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to add attachment:", error);
    return { attachment: null, error };
  }

  return { attachment: data, error: null };
}

/**
 * Remove attachment from insight
 */
export async function removeInsightAttachment({ adminSupabase, attachment_id }) {
  const { error } = await adminSupabase
    .from("content_attachments")
    .delete()
    .eq("id", attachment_id);

  if (error) {
    console.error("Failed to remove attachment:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Fetch available tags for insights
 */
export async function fetchInsightTags({ supabase }) {
  const { data, error } = await supabase
    .from("domain_tags")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to fetch tags:", error);
    return { tags: [], error };
  }

  return { tags: data || [], error: null };
}

/**
 * Build summary stats for admin dashboard
 */
export function buildInsightsSummary(insights) {
  return {
    total: insights.length,
    published: insights.filter((i) => i.publish_status === "published").length,
    draft: insights.filter((i) => i.publish_status === "draft").length,
    archived: insights.filter((i) => i.publish_status === "archived").length,
  };
}

/**
 * Filter insights based on criteria
 */
export function filterInsights(insights, filters) {
  const { status = "all", type = "all", search = "" } = filters;

  return insights.filter((insight) => {
    // Status filter
    if (status !== "all" && insight.publish_status !== status) {
      return false;
    }

    // Type filter
    if (type !== "all" && insight.content_type !== type) {
      return false;
    }

    // Search filter
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const titleMatch = insight.title?.toLowerCase().includes(searchTerm);
      const summaryMatch = insight.summary?.toLowerCase().includes(searchTerm);
      if (!titleMatch && !summaryMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Generate URL-friendly slug
 */
export function generateInsightSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format content type for display
 */
export function formatContentType(type) {
  const typeMap = {
    report: "Report",
    brief: "Brief",
    case_study: "Case Study",
    article: "Article",
    workshop_proceedings: "Workshop Proceedings",
  };
  return typeMap[type] || type;
}

/**
 * Format publish status for display
 */
export function formatPublishStatus(status) {
  const statusMap = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  return statusMap[status] || status;
}
