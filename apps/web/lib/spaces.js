import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildSpaceJoinRequestContext,
  isClosedSpaceJoinRequestStatus,
  parseSpaceJoinRequestDetails,
} from "@/lib/space-join-requests";
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

function getPrivilegedSpacesClient(fallbackSupabase) {
  return canUseSupabaseAdmin() ? createSupabaseAdminClient() : fallbackSupabase;
}

async function enrichWorkspaceSpace({
  role = "",
  space,
  supabase,
}) {
  const [threadsResult, membersResult, tags] = await Promise.all([
    supabase
      .from("threads")
      .select("id", { count: "exact", head: true })
      .eq("space_id", space.id),
    supabase
      .from("space_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("space_id", space.id),
    fetchSpaceTagsSafe(supabase, space.id),
  ]);

  return {
    ...space,
    isMember: Boolean(role) || space.visibility === "public_members",
    member_count: membersResult.count ?? 0,
    requiresRequest: !role && space.visibility !== "public_members",
    role: role || (space.visibility === "public_members" ? "member" : ""),
    threads: threadsResult.count ?? 0,
    unread: 0,
    tags,
  };
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
 * Fetch a single space by slug, with tags and members.
 * Returns null when the space doesn't exist or the user can't access it.
 */
export async function fetchSpaceBySlug({ supabase, slug, userId }) {
  const privilegedSupabase = getPrivilegedSpacesClient(supabase);
  const { data, error } = await privilegedSupabase
    .from("spaces")
    .select("id, name, slug, space_type, description, visibility")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return { space: null, error: error || new Error("Space not found") };
  }

  const [tags, currentMembershipResult] = await Promise.all([
    fetchSpaceTagsSafe(privilegedSupabase, data.id),
    userId
      ? privilegedSupabase
          .from("space_memberships")
          .select("role, user_id")
          .eq("space_id", data.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const currentMembership = currentMembershipResult.data || null;
  const isMember = Boolean(currentMembership) || data.visibility === "public_members";

  let members = [];

  if (isMember) {
    const { data: membersData } = await privilegedSupabase
      .from("space_memberships")
      .select("role, user_id, profile:user_id(id, first_name, surname, organisation_name)")
      .eq("space_id", data.id)
      .order("joined_at", { ascending: false });

    members = membersData || [];
  }

  return {
    space: {
      ...data,
      tags,
      members,
      currentUserRole: currentMembership?.role || (data.visibility === "public_members" ? "member" : null),
      isMember,
    },
    error: null,
  };
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
  const privilegedSupabase = getPrivilegedSpacesClient(supabase);

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
    spaces.map((space) =>
      enrichWorkspaceSpace({
        role: roleMap.get(space.id) || "member",
        space,
        supabase: privilegedSupabase,
      }),
    )
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
    publicExtra.map((space) =>
      enrichWorkspaceSpace({
        role: "member",
        space,
        supabase: privilegedSupabase,
      }),
    )
  );

  return {
    spaces: await translateSpacesForDisplay(
      [...enriched, ...publicEnriched],
      await getRequestLocale(),
    ),
    error: null,
  };
}

export async function fetchWorkspaceSpaces({ supabase, userId }) {
  const memberSpacesResult = await fetchMemberSpaces({ supabase, userId });
  const memberSpaces = memberSpacesResult.spaces || [];

  if (!canUseSupabaseAdmin()) {
    return {
      availableSpaces: [],
      error: memberSpacesResult.error,
      memberSpaces,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: allSpaces, error: allSpacesError } = await adminSupabase
    .from("spaces")
    .select("id, name, slug, space_type, description, visibility")
    .order("name", { ascending: true });

  if (allSpacesError) {
    console.error("Failed to fetch discoverable spaces:", allSpacesError);
    return {
      availableSpaces: [],
      error: memberSpacesResult.error || allSpacesError,
      memberSpaces,
    };
  }

  const joinedSpaceIds = new Set(memberSpaces.map((space) => space.id));
  const discoverableSpaces = (allSpaces || []).filter((space) => !joinedSpaceIds.has(space.id));

  const enrichedAvailableSpaces = await Promise.all(
    discoverableSpaces.map((space) =>
      enrichWorkspaceSpace({
        role: "",
        space,
        supabase: adminSupabase,
      }),
    ),
  );

  return {
    availableSpaces: await translateSpacesForDisplay(
      enrichedAvailableSpaces,
      await getRequestLocale(),
    ),
    error: memberSpacesResult.error || null,
    memberSpaces,
  };
}

export async function fetchPendingSpaceJoinRequests({ adminSupabase, spaceId }) {
  const context = buildSpaceJoinRequestContext(spaceId);
  const { data, error } = await adminSupabase
    .from("service_requests")
    .select("id, requester_name, requester_email, organisation, country, details, status, created_at")
    .eq("request_type", "coordination")
    .eq("decision_context", context)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch pending space join requests:", error);
    return { requests: [], error };
  }

  return {
    requests: (data || [])
      .map((request) => ({
        ...request,
        joinRequest: parseSpaceJoinRequestDetails(request.details),
      }))
      .filter(
        (request) =>
          request.joinRequest.category === "space_join" &&
          !isClosedSpaceJoinRequestStatus(request.status),
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
 * Lightweight member name list for @mention detection.
 * Returns only id, first_name, surname — no heavy profile data.
 */
export async function fetchSpaceMemberNames({ supabase, spaceId }) {
  const { data, error } = await supabase
    .from("space_memberships")
    .select("profile:user_id(id, first_name, surname)")
    .eq("space_id", spaceId);

  if (error) return [];
  return (data || [])
    .map((row) => row.profile)
    .filter((p) => p?.id && p.first_name && p.surname);
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
