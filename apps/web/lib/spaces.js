import { getRequestLocale, translateContentItems } from "@/lib/translation";
import {
  SPACE_MEMBER_ROLES,
  SPACE_TYPES,
  SPACE_VISIBILITY,
  formatSpaceType,
  formatSpaceVisibility,
  generateSpaceSlug,
} from "@/lib/space-types";

export {
  SPACE_MEMBER_ROLES,
  SPACE_TYPES,
  SPACE_VISIBILITY,
  formatSpaceType,
  formatSpaceVisibility,
  generateSpaceSlug,
} from "@/lib/space-types";

/**
 * Safe wrapper around space_tag_map query.
 * Returns [] instead of throwing if the table doesn't exist yet (pre-migration).
 */
async function fetchSpaceTagsSafe(supabase, spaceId) {
  try {
    const { data, error } = await supabase
      .from("space_tag_map")
      .select("domain_tags(id, name, slug)")
      .eq("space_id", spaceId);

    if (error) return [];
    return data?.map((t) => t.domain_tags).filter(Boolean) || [];
  } catch {
    return [];
  }
}

async function translateSpacesForDisplay(spaces, locale) {
  if (!spaces.length) {
    return spaces;
  }

  const items = [];
  const pushItem = (cacheKey, contentType, fieldName, text) => {
    if (typeof text !== "string" || !text.trim()) {
      return;
    }

    items.push({
      cacheKey,
      contentType,
      fieldName,
      text,
      format: "text",
    });
  };

  for (const space of spaces) {
    pushItem(`space:${space.id}:name`, "space", "name", space.name || "");
    pushItem(`space:${space.id}:description`, "space", "description", space.description || "");

    for (const tag of space.tags || []) {
      if (tag?.slug && tag?.name) {
        pushItem(`domain_tag:${tag.slug}:name`, "domain_tag", "name", tag.name);
      }
    }
  }

  const translated = await translateContentItems(locale, items);
  const translatedByKey = new Map(translated.map((item) => [item.cacheKey, item.displayText]));

  return spaces.map((space) => ({
    ...space,
    originalName: space.name,
    originalDescription: space.description,
    name: translatedByKey.get(`space:${space.id}:name`) || space.name,
    description: translatedByKey.get(`space:${space.id}:description`) || space.description,
    tags: (space.tags || []).map((tag) => ({
      ...tag,
      originalName: tag.name,
      name: translatedByKey.get(`domain_tag:${tag.slug}:name`) || tag.name,
    })),
  }));
}

/**
 * Fetch all spaces for the admin interface, with member counts and tags.
 */
export async function fetchAdminSpaces({ supabase, filters = {} }) {
  const { type = "all", search = "" } = filters;

  let query = supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (type && type !== "all") {
    query = query.eq("space_type", type);
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch admin spaces:", error);
    return { spaces: [], error };
  }

  // Attach tags and member counts
  const enriched = await Promise.all(
    (data || []).map(async (space) => {
      const [tagsResult, membersResult] = await Promise.all([
        fetchSpaceTagsSafe(supabase, space.id),
        supabase
          .from("space_memberships")
          .select("user_id, role", { count: "exact" })
          .eq("space_id", space.id),
      ]);

      return {
        ...space,
        tags:         tagsResult,
        member_count: membersResult.count ?? 0,
      };
    })
  );

  return { spaces: enriched, error: null };
}

/**
 * Fetch a single space by ID, with tags and members.
 */
export async function fetchSpaceById({ supabase, id }) {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { space: null, error };
  }

  const [tags, membersResult] = await Promise.all([
    fetchSpaceTagsSafe(supabase, id),
    supabase
      .from("space_memberships")
      .select(`
        role, joined_at,
        profile:user_id(id, first_name, surname, email, organisation_name)
      `)
      .eq("space_id", id)
      .order("joined_at", { ascending: false }),
  ]);

  return {
    space: {
      ...data,
      tags:    tags,
      members: membersResult.data || [],
    },
    error: null,
  };
}

/**
 * Create a new space (admin only).
 */
export async function createSpace({ adminSupabase, data, userId }) {
  const {
    name,
    slug,
    space_type,
    description,
    lead_name,
    partner_org,
    visibility,
    tag_ids = [],
  } = data;

  // lead_name and partner_org added in migration 0022 — include only when provided
  const insertPayload = {
    name, slug, space_type,
    description: description || null,
    visibility,
    created_by:  userId,
  };
  if (lead_name)   insertPayload.lead_name   = lead_name;
  if (partner_org) insertPayload.partner_org = partner_org;

  const { data: space, error: insertError } = await adminSupabase
    .from("spaces")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create space:", insertError);
    return { space: null, error: insertError };
  }

  if (tag_ids.length > 0) {
    const { error: tagError } = await adminSupabase
      .from("space_tag_map")
      .insert(tag_ids.map((tag_id) => ({ space_id: space.id, tag_id })));

    if (tagError) {
      // space_tag_map added in migration 0022 — silently skip if table not yet applied
      console.warn("space_tag_map not available yet:", tagError.message);
    }
  }

  return { space, error: null };
}

/**
 * Update an existing space (admin only).
 */
export async function updateSpace({ adminSupabase, id, data }) {
  const {
    name,
    space_type,
    description,
    lead_name,
    partner_org,
    visibility,
    tag_ids,
  } = data;

  // lead_name, partner_org, updated_at added in migration 0022 — omit if not yet applied
  const updatePayload = { name, space_type, description: description || null, visibility };
  if (lead_name   !== undefined) updatePayload.lead_name   = lead_name   || null;
  if (partner_org !== undefined) updatePayload.partner_org = partner_org || null;

  const { data: space, error: updateError } = await adminSupabase
    .from("spaces")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update space:", updateError);
    return { space: null, error: updateError };
  }

  if (tag_ids !== undefined) {
    // space_tag_map added in migration 0022 — silently skip if table not yet applied
    try {
      await adminSupabase.from("space_tag_map").delete().eq("space_id", id);

      if (tag_ids.length > 0) {
        await adminSupabase
          .from("space_tag_map")
          .insert(tag_ids.map((tag_id) => ({ space_id: id, tag_id })));
      }
    } catch {
      // table not yet available
    }
  }

  return { space, error: null };
}

/**
 * Delete a space (admin only).
 */
export async function deleteSpace({ adminSupabase, id }) {
  const { error } = await adminSupabase
    .from("spaces")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete space:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Fetch all available tags for space tagging.
 */
export async function fetchSpaceTags({ supabase }) {
  const { data, error } = await supabase
    .from("domain_tags")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to fetch space tags:", error);
    return { tags: [], error };
  }

  return { tags: data || [], error: null };
}

/**
 * Fetch members of a specific space with profile data.
 */
export async function fetchSpaceMembers({ supabase, spaceId }) {
  const { data, error } = await supabase
    .from("space_memberships")
    .select(`
      role, joined_at,
      profile:user_id(id, first_name, surname, email, organisation_name, country_of_residence)
    `)
    .eq("space_id", spaceId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch space members:", error);
    return { members: [], error };
  }

  return { members: data || [], error: null };
}

/**
 * Add a member to a space.
 */
export async function addSpaceMember({ adminSupabase, spaceId, userId, role = "member" }) {
  const { error } = await adminSupabase
    .from("space_memberships")
    .insert({ space_id: spaceId, user_id: userId, role });

  if (error) {
    console.error("Failed to add space member:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Update a member's role in a space.
 */
export async function updateSpaceMemberRole({ adminSupabase, spaceId, userId, role }) {
  const { error } = await adminSupabase
    .from("space_memberships")
    .update({ role })
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update member role:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Remove a member from a space.
 */
export async function removeSpaceMember({ adminSupabase, spaceId, userId }) {
  const { error } = await adminSupabase
    .from("space_memberships")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to remove space member:", error);
    return { error };
  }

  return { error: null };
}

/**
 * Fetch spaces a user belongs to (for the member workspace).
 */
export async function fetchMemberSpaces({ supabase, userId }) {
  // First get memberships (avoid nested query to prevent RLS recursion)
  const { data: memberships, error: membershipError } = await supabase
    .from("space_memberships")
    .select("space_id, role")
    .eq("user_id", userId);

  if (membershipError) {
    console.error("Failed to fetch member spaces:", JSON.stringify(membershipError, null, 2));
    return { spaces: [], error: membershipError };
  }

  // Get space details separately
  const spaceIds = memberships?.map((m) => m.space_id) || [];
  let spaces = [];
  
  if (spaceIds.length > 0) {
    const { data: spacesData, error: spacesError } = await supabase
      .from("spaces")
      .select("id, name, slug, space_type, description, visibility")
      .in("id", spaceIds);

    if (spacesError) {
      console.error("Failed to fetch spaces:", JSON.stringify(spacesError, null, 2));
      return { spaces: [], error: spacesError };
    }
    spaces = spacesData || [];
  }

  // Create a map of space_id -> role
  const roleMap = new Map(memberships?.map((m) => [m.space_id, m.role]));

  // Enrich with thread counts and tags
  const enriched = await Promise.all(
    spaces.map(async (space) => {
      const [threadsResult, tags] = await Promise.all([
        supabase
          .from("threads")
          .select("id", { count: "exact" })
          .eq("space_id", space.id),
        fetchSpaceTagsSafe(supabase, space.id),
      ]);

      return {
        ...space,
        role:     roleMap.get(space.id) || "member",
        threads:  threadsResult.count ?? 0,
        unread:   0, // placeholder — extend with read-tracking later
        tags,
      };
    })
  );

  // Also include public_members spaces the user isn't explicitly a member of
  const publicSpacesResult = await supabase
    .from("spaces")
    .select("id, name, slug, space_type, description, visibility")
    .eq("visibility", "public_members");

  const memberSpaceIds = new Set(enriched.map((s) => s.id));
  const publicExtra = (publicSpacesResult.data || []).filter(
    (s) => !memberSpaceIds.has(s.id)
  );

  const publicEnriched = await Promise.all(
    publicExtra.map(async (space) => {
      const [threadsResult, tags] = await Promise.all([
        supabase
          .from("threads")
          .select("id", { count: "exact" })
          .eq("space_id", space.id),
        fetchSpaceTagsSafe(supabase, space.id),
      ]);

      return {
        ...space,
        role:    "member",
        threads: threadsResult.count ?? 0,
        unread:  0,
        tags,
      };
    })
  );

  return {
    spaces: await translateSpacesForDisplay(
      [...enriched, ...publicEnriched],
      await getRequestLocale(),
    ),
    error: null,
  };
}

/**
 * Build summary stats for admin list.
 */
export function buildSpacesSummary(spaces) {
  return {
    total:         spaces.length,
    cohort:        spaces.filter((s) => s.space_type === "cohort").length,
    constituency:  spaces.filter((s) => s.space_type === "constituency").length,
    working_group: spaces.filter((s) => s.space_type === "working_group").length,
  };
}

/**
 * Client-side filter helper.
 */
export function filterSpaces(spaces, { type = "all", search = "" } = {}) {
  return spaces.filter((space) => {
    if (type !== "all" && space.space_type !== type) return false;

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      const nameMatch = space.name?.toLowerCase().includes(term);
      const descMatch = space.description?.toLowerCase().includes(term);
      if (!nameMatch && !descMatch) return false;
    }

    return true;
  });
}
