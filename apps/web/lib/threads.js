/**
 * Data-fetching helpers for space threads and comments.
 * All queries run through the user's Supabase client so RLS is enforced.
 */

/** Strip HTML tags for plain-text excerpts in list views. */
function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fetch paginated threads for a space, with author profile and comment count.
 */
export async function fetchSpaceThreads(supabase, spaceId, { page = 0, limit = 20 } = {}) {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("threads")
    .select(
      `id, title, body, created_at, updated_at,
       author:author_id(id, first_name, surname),
       comments(count)`,
      { count: "exact" }
    )
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchSpaceThreads error:", error);
    return { threads: [], total: 0, error };
  }

  const threads = (data || []).map((row) => ({
    id:           row.id,
    title:        row.title,
    excerpt:      stripHtml(row.body).slice(0, 200),
    body:         row.body,
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    author:       normaliseProfile(row.author),
    commentCount: Number(row.comments?.[0]?.count ?? 0),
  }));

  return { threads, total: count ?? 0, error: null };
}

/**
 * Fetch a single thread with its full body and author profile.
 */
export async function fetchThreadById(supabase, threadId) {
  const { data, error } = await supabase
    .from("threads")
    .select(
      `id, title, body, space_id, created_at, updated_at,
       author:author_id(id, first_name, surname)`
    )
    .eq("id", threadId)
    .single();

  if (error) {
    console.error("fetchThreadById error:", error);
    return { thread: null, error };
  }

  return {
    thread: {
      id:        data.id,
      title:     data.title,
      body:      data.body,
      spaceId:   data.space_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author:    normaliseProfile(data.author),
    },
    error: null,
  };
}

/**
 * Fetch all comments for a thread, ordered oldest-first.
 */
export async function fetchThreadComments(supabase, threadId) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, body, created_at, updated_at,
       author:author_id(id, first_name, surname)`
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchThreadComments error:", error);
    return { comments: [], error };
  }

  const comments = (data || []).map((row) => ({
    id:        row.id,
    body:      row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author:    normaliseProfile(row.author),
  }));

  return { comments, error: null };
}

/**
 * Fetch the most-recent N thread titles for each space in a batch.
 * Returns a map of { [spaceId]: [{ id, title }] }.
 */
export async function fetchRecentThreadsBySpaces(supabase, spaceIds, { perSpace = 2 } = {}) {
  if (!spaceIds?.length) return {};

  const { data, error } = await supabase
    .from("threads")
    .select("id, title, space_id, created_at")
    .in("space_id", spaceIds)
    .order("created_at", { ascending: false })
    .limit(perSpace * spaceIds.length + 20);

  if (error || !data) return {};

  const bySpaceId = {};
  for (const thread of data) {
    if (!bySpaceId[thread.space_id]) bySpaceId[thread.space_id] = [];
    if (bySpaceId[thread.space_id].length < perSpace) {
      bySpaceId[thread.space_id].push({ id: thread.id, title: thread.title });
    }
  }
  return bySpaceId;
}

/**
 * Fetch the latest threads across a set of spaces for dashboard/feed views.
 */
export async function fetchRecentThreadFeedBySpaces(supabase, spaceIds, { limit = 4 } = {}) {
  if (!spaceIds?.length) {
    return { threads: [], error: null };
  }

  const { data, error } = await supabase
    .from("threads")
    .select(
      `id, title, space_id, created_at,
       author:author_id(id, first_name, surname),
       comments(count)`,
    )
    .in("space_id", spaceIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchRecentThreadFeedBySpaces error:", error);
    return { threads: [], error };
  }

  return {
    threads: (data || []).map((row) => ({
      author: normaliseProfile(row.author),
      commentCount: Number(row.comments?.[0]?.count ?? 0),
      createdAt: row.created_at,
      id: row.id,
      spaceId: row.space_id,
      title: row.title,
    })),
    error: null,
  };
}

// ── Prose HTML sanitization ──────────────────────────────────────────────────

/**
 * Normalise prose HTML from the TipTap editor before rendering.
 * - Preserves root-relative internal links.
 * - Ensures external links open in a new tab with noopener.
 * - Adds https:// to bare URLs so they don't resolve as relative paths.
 */
export function sanitizeProseHtml(html) {
  if (!html) return "";
  return html.replace(/<a\s([^>]*)>/gi, (match, attrs) => {
    const hrefMatch = attrs.match(/href="([^"]*)"/i);
    if (!hrefMatch) return match;

    let href = hrefMatch[1];

    // Leave anchor-only and root-relative links unchanged
    if (href.startsWith("#")) return match;
    if (href.startsWith("/")) {
      const cleanedInternal = attrs
        .replace(/target="[^"]*"\s*/gi, "")
        .replace(/rel="[^"]*"\s*/gi, "")
        .trim();
      return `<a ${cleanedInternal}>`;
    }

    // Normalise bare domains / paths without a protocol
    if (!/^https?:\/\/|^mailto:|^tel:/i.test(href)) {
      href = `https://${href}`;
    }

    // Strip existing href / target / rel so we can re-apply cleanly
    const cleaned = attrs
      .replace(/href="[^"]*"\s*/gi, "")
      .replace(/target="[^"]*"\s*/gi, "")
      .replace(/rel="[^"]*"\s*/gi, "")
      .trim();

    const extra = cleaned ? ` ${cleaned}` : "";
    return `<a${extra} href="${href}" target="_blank" rel="noopener noreferrer">`;
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normaliseProfile(profile) {
  if (!profile) return { id: null, name: "Unknown", initials: "?" };
  const first = profile.first_name || "";
  const last  = profile.surname    || "";
  const name  = [first, last].filter(Boolean).join(" ") || profile.email || "Member";
  const initials = [first[0], last[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";
  return { id: profile.id, name, initials };
}
