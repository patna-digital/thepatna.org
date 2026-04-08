"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { createEventSlug, splitEventList } from "@/lib/events";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadContentImage } from "@/lib/content-images";

function buildEventPath({ eventId = "", notice = "" }) {
  const basePath = eventId ? `/admin/events/${eventId}` : "/admin/events";
  const params = new URLSearchParams();

  if (notice) {
    params.set("notice", notice);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function parseOptionalText(formData, key) {
  const value = String(formData.get(key) || "").trim();
  return value || "";
}

function parseDateInput(value, { endOfDay = false } = {}) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (endOfDay) {
    parsed.setUTCHours(23, 59, 59, 0);
  }

  return parsed.toISOString();
}

function normaliseEventStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["draft", "published", "archived"].includes(normalized) ? normalized : "draft";
}

function normaliseVisibility(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["public", "members", "restricted"].includes(normalized) ? normalized : "public";
}

function normaliseScheduleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["past", "upcoming", "tbc"].includes(normalized) ? normalized : "upcoming";
}

async function ensureUniqueSlug({ currentEventId = "", initialSlug, supabase }) {
  let candidate = initialSlug;

  while (candidate) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing || existing.id === currentEventId) {
      return candidate;
    }

    candidate = `${initialSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  return crypto.randomUUID();
}

export async function saveAdminEventAction(formData) {
  const { supabase, user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const eventId = parseOptionalText(formData, "event_id");
  const title = parseOptionalText(formData, "title");
  const displayDate = parseOptionalText(formData, "display_date");
  const startsOn = parseOptionalText(formData, "starts_on");

  if (!title || (!displayDate && !startsOn)) {
    redirect(buildEventPath({ eventId, notice: "missing-fields" }));
  }

  const startsAt = parseDateInput(startsOn);
  const endsAt = parseDateInput(parseOptionalText(formData, "ends_on"), { endOfDay: true });
  const computedDisplayDate =
    displayDate ||
    (startsOn && parseOptionalText(formData, "ends_on") && startsOn !== parseOptionalText(formData, "ends_on")
      ? `${startsOn} to ${parseOptionalText(formData, "ends_on")}`
      : startsOn);

  let existingEvent = null;

  if (eventId) {
    const { data } = await supabase
      .from("events")
      .select("id, slug, created_by_user_id")
      .eq("id", eventId)
      .maybeSingle();

    existingEvent = data || null;

    if (!existingEvent) {
      redirect(buildEventPath({ notice: "error" }));
    }
  }

  const slug = await ensureUniqueSlug({
    currentEventId: eventId,
    initialSlug: existingEvent?.slug || createEventSlug(title),
    supabase,
  });

  // Cover image: upload file if provided, otherwise keep existing URL
  const coverImageFile = formData.get("cover_image_file");
  const existingCoverUrl = parseOptionalText(formData, "cover_image_url") || null;
  let cover_image_url = existingCoverUrl;

  if (coverImageFile && Number(coverImageFile.size) > 0) {
    try {
      const { imageUrl } = await uploadContentImage({
        adminSupabase: adminClient,
        file: coverImageFile,
        userId: user.id,
        subfolder: "events",
        currentImageUrl: existingCoverUrl || "",
      });
      cover_image_url = imageUrl || existingCoverUrl;
    } catch {
      redirect(buildEventPath({ eventId, notice: "error" }));
    }
  }

  const payload = {
    title,
    slug,
    event_type: parseOptionalText(formData, "event_type") || null,
    organising_institutions: splitEventList(formData.get("organising_institutions")),
    starts_at: startsAt,
    ends_at: endsAt,
    display_date: computedDisplayDate || null,
    location: parseOptionalText(formData, "location") || null,
    summary: parseOptionalText(formData, "summary") || null,
    body: parseOptionalText(formData, "body") || null,
    patna_involvement: parseOptionalText(formData, "patna_involvement") || null,
    themes: splitEventList(formData.get("themes")),
    official_link: parseOptionalText(formData, "official_link") || null,
    visibility: normaliseVisibility(formData.get("visibility")),
    status: normaliseEventStatus(formData.get("status")),
    schedule_status: normaliseScheduleStatus(formData.get("schedule_status")),
    cover_image_url,
    cover_image_alt: parseOptionalText(formData, "cover_image_alt") || null,
    created_by_user_id: existingEvent?.created_by_user_id || user.id,
    updated_by_user_id: user.id,
  };

  const query = eventId
    ? supabase.from("events").update(payload).eq("id", eventId)
    : supabase.from("events").insert(payload);

  const { data, error } = await query.select("id").single();

  if (error || !data?.id) {
    redirect(buildEventPath({ eventId, notice: "error" }));
  }

  redirect(buildEventPath({ eventId: data.id, notice: "saved" }));
}
