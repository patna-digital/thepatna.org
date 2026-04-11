import {
  canUseSupabaseAdmin,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { formatContentType } from "@/lib/content-types";
import {
  isMissingContentGalleryRelation,
  serialisePublicationError,
} from "@/lib/publication-query-fallback";
import { orderPublicationAttachments } from "@/lib/publication-attachments";
import { getRequestLocale, translateContentItems } from "@/lib/translation";

const PUBLICATION_SELECT = `
  *,
  content_attachments(*),
  content_tag_map(domain_tags(id, name, slug))
`;
const PUBLICATION_SELECT_WITH_GALLERY = `
  ${PUBLICATION_SELECT},
  content_gallery(id, image_url, alt_text, caption, sort_order)
`;

function normalisePublication(item) {
  return {
    ...item,
    attachments: orderPublicationAttachments(item.content_attachments || []),
    tags: item.content_tag_map?.map((tagRow) => tagRow.domain_tags).filter(Boolean) || [],
    gallery: (item.content_gallery || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
}

async function translatePublicationsForDisplay(publications, locale) {
  if (!publications.length) {
    return publications;
  }

  const items = [];
  const pushItem = (cacheKey, fieldName, text) => {
    if (typeof text !== "string" || !text.trim()) {
      return;
    }

    items.push({
      cacheKey,
      contentType: "publication",
      fieldName,
      text,
    });
  };

  for (const publication of publications) {
    pushItem(`publication:${publication.id}:title`, "title", publication.title || "");
    pushItem(`publication:${publication.id}:summary`, "summary", publication.summary || "");
    pushItem(`publication:${publication.id}:body`, "body", publication.body || "");
    pushItem(`publication:${publication.id}:meta_description`, "meta_description", publication.meta_description || "");
    pushItem(`publication:${publication.id}:cover_image_alt`, "cover_image_alt", publication.cover_image_alt || "");
    pushItem(
      `content_type:${publication.content_type}:label`,
      "content_type_label",
      formatContentType(publication.content_type),
    );

    for (const tag of publication.tags || []) {
      if (tag?.slug && tag?.name) {
        pushItem(`domain_tag:${tag.slug}:name`, "tag_name", tag.name);
      }
    }
  }

  const translated = await translateContentItems(locale, items);
  const translatedByKey = new Map(translated.map((item) => [item.cacheKey, item.displayText]));

  return publications.map((publication) => ({
    ...publication,
    sourceTitle: publication.title,
    sourceSummary: publication.summary,
    sourceBody: publication.body,
    title: translatedByKey.get(`publication:${publication.id}:title`) || publication.title,
    summary: translatedByKey.get(`publication:${publication.id}:summary`) || publication.summary,
    body: translatedByKey.get(`publication:${publication.id}:body`) || publication.body,
    meta_description:
      translatedByKey.get(`publication:${publication.id}:meta_description`) || publication.meta_description,
    cover_image_alt:
      translatedByKey.get(`publication:${publication.id}:cover_image_alt`) || publication.cover_image_alt,
    contentTypeLabel:
      translatedByKey.get(`content_type:${publication.content_type}:label`) ||
      formatContentType(publication.content_type),
    tags: (publication.tags || []).map((tag) => ({
      ...tag,
      originalName: tag.name,
      name: translatedByKey.get(`domain_tag:${tag.slug}:name`) || tag.name,
    })),
  }));
}

async function runPublicationsQuery({
  supabase,
  filters = {},
  expectSingle = false,
}) {
  const { limit = 0, slug = "" } = filters;

  const buildQuery = (selectClause) => {
    let query = supabase
      .from("content_items")
      .select(selectClause)
      .eq("publish_status", "published")
      .eq("visibility", "public");

    if (slug) {
      query = query.eq("slug", slug);
    }

    if (expectSingle) {
      return query.maybeSingle();
    }

    query = query.order("published_at", { ascending: false });

    if (limit > 0) {
      query = query.limit(limit);
    }

    return query;
  };

  let result = await buildQuery(PUBLICATION_SELECT_WITH_GALLERY);

  if (result.error && isMissingContentGalleryRelation(result.error)) {
    console.warn("Publications query is falling back because content_gallery is unavailable.", {
      error: serialisePublicationError(result.error),
    });
    result = await buildQuery(PUBLICATION_SELECT);
  }

  return result;
}

export async function fetchPublicPublications({ limit = 0 } = {}) {
  if (!canUseSupabaseAdmin()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await runPublicationsQuery({
    filters: { limit },
    supabase,
  });

  if (error) {
    console.error("Failed to fetch public publications:", serialisePublicationError(error));
    return [];
  }

  return translatePublicationsForDisplay(
    (data || []).map(normalisePublication),
    await getRequestLocale(),
  );
}

export async function fetchPublicPublicationBySlug(slug) {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await runPublicationsQuery({
    expectSingle: true,
    filters: { slug },
    supabase,
  });

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch public publication by slug:", serialisePublicationError(error));
    }
    return null;
  }

  const [publication] = await translatePublicationsForDisplay(
    [normalisePublication(data)],
    await getRequestLocale(),
  );

  return publication;
}
