"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { createEventSlug, splitEventList } from "@/lib/events";
import { getCurrentUserContext } from "@/lib/supabase/access";

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

export async function submitMemberEventAction(formData) {
  const { user, supabase, isAdmin } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/events/submit");
  }

  const title = parseOptionalText(formData, "title");
  const displayDate = parseOptionalText(formData, "display_date");
  const startsOn = parseOptionalText(formData, "starts_on");
  const endsOn = parseOptionalText(formData, "ends_on");

  if (!title || (!displayDate && !startsOn)) {
    redirect("/app/events/submit?notice=missing-fields");
  }

  const startsAt = parseDateInput(startsOn);
  const endsAt = parseDateInput(endsOn, { endOfDay: true });
  const computedDisplayDate =
    displayDate ||
    (startsOn && endsOn && startsOn !== endsOn ? `${startsOn} to ${endsOn}` : startsOn);

  const basePayload = {
    title,
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
  };

  if (isAdmin) {
    const slug = await ensureUniqueSlug({
      initialSlug: createEventSlug(title),
      supabase,
    });

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...basePayload,
        slug,
        visibility: "members",
        status: "draft",
        schedule_status: normaliseScheduleStatus("upcoming"),
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      redirect("/app/events/submit?notice=error");
    }

    redirect(`/admin/events/${data.id}?notice=saved`);
  }

  const { error } = await supabase
    .from("event_submissions")
    .insert({
      ...basePayload,
      submitted_by_user_id: user.id,
      submission_status: "submitted",
    });

  if (error) {
    redirect("/app/events/submit?notice=error");
  }

  redirect("/app/events?notice=submitted");
}
