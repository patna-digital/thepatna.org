"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { createServiceRequestSlug, splitServiceRequestDetails } from "@/lib/service-requests";
import { requireAdminContext } from "@/lib/supabase/access";

function buildServiceRequestPath({ requestId = "", notice = "" }) {
  const basePath = requestId ? `/admin/service-requests/${requestId}` : "/admin/service-requests";
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

function normaliseRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["new", "in_progress", "review", "completed", "cancelled"].includes(normalized) ? normalized : "new";
}

async function ensureUniqueSlug({ currentRequestId = "", initialSlug, supabase }) {
  let candidate = initialSlug;

  while (candidate) {
    const { data: existing } = await supabase
      .from("service_requests")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing || existing.id === currentRequestId) {
      return candidate;
    }

    candidate = `${initialSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  return crypto.randomUUID();
}

export async function saveAdminServiceRequestAction(formData) {
  const { supabase, user } = await requireAdminContext();
  const requestId = parseOptionalText(formData, "request_id");
  const requesterName = parseOptionalText(formData, "requester_name");
  const requesterEmail = parseOptionalText(formData, "requester_email");
  const organisation = parseOptionalText(formData, "organisation");
  const details = parseOptionalText(formData, "details");

  if (!requesterName || !requesterEmail || !details) {
    redirect(buildServiceRequestPath({ requestId, notice: "missing-fields" }));
  }

  const country = parseOptionalText(formData, "country") || null;
  const decisionContext = parseOptionalText(formData, "decision_context") || null;
  const timeline = parseOptionalText(formData, "timeline") || null;

  let existingRequest = null;

  if (requestId) {
    const { data } = await supabase
      .from("service_requests")
      .select("id, slug, created_by_user_id")
      .eq("id", requestId)
      .maybeSingle();

    existingRequest = data || null;

    if (!existingRequest) {
      redirect(buildServiceRequestPath({ notice: "error" }));
    }
  }

  const slug = await ensureUniqueSlug({
    currentRequestId: requestId,
    initialSlug: existingRequest?.slug || createServiceRequestSlug(requesterName),
    supabase,
  });

  const payload = {
    requester_name: requesterName,
    requester_email: requesterEmail,
    organisation: organisation || null,
    request_type: parseOptionalText(formData, "request_type") || null,
    details,
    country,
    decision_context: decisionContext,
    timeline,
    status: normaliseRequestStatus(formData.get("status")),
    assigned_to_user_id: parseOptionalText(formData, "assigned_to_user_id") || null,
    updated_by_user_id: user.id,
    ...(existingRequest ? { created_by_user_id: existingRequest.created_by_user_id } : { created_by_user_id: user.id }),
  };

  const query = requestId
    ? supabase.from("service_requests").update(payload).eq("id", requestId)
    : supabase.from("service_requests").insert(payload);

  const { data, error } = await query.select("id").single();

  if (error || !data?.id) {
    redirect(buildServiceRequestPath({ requestId, notice: "error" }));
  }

  redirect(buildServiceRequestPath({ requestId: data.id, notice: "saved" }));
}

export async function deleteAdminServiceRequestAction(formData) {
  const { supabase } = await requireAdminContext();
  const requestId = String(formData.get("request_id") || "");

  if (!requestId) {
    return redirect("/admin/service-requests?notice=error");
  }

  const { error } = await supabase.from("service_requests").delete().eq("id", requestId);

  if (error) {
    return redirect(`/admin/service-requests?notice=error`);
  }

  return redirect("/admin/service-requests?notice=deleted");
}