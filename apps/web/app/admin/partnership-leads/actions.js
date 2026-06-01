"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { createPartnershipLeadSlug, splitPartnershipLeadDetails } from "@/lib/partnership-leads";
import { requireAdminContext } from "@/lib/supabase/access";

function buildPartnershipLeadPath({ leadId = "", notice = "" }) {
  const basePath = leadId ? `/admin/partnership-leads/${leadId}` : "/admin/partnership-leads";
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

function normaliseLeadStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["new", "contacted", "in_discussion", "proposal_sent", "negotiation", "closed_won", "closed_lost"].includes(normalized) ? normalized : "new";
}

async function ensureUniqueSlug({ currentLeadId = "", initialSlug, supabase }) {
  let candidate = initialSlug;

  while (candidate) {
    const { data: existing } = await supabase
      .from("partnership_leads")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing || existing.id === currentLeadId) {
      return candidate;
    }

    candidate = `${initialSlug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  return crypto.randomUUID();
}

export async function saveAdminPartnershipLeadAction(formData) {
  const { supabase, user } = await requireAdminContext();
  const leadId = parseOptionalText(formData, "lead_id");
  const organisation = parseOptionalText(formData, "organisation");
  const name = parseOptionalText(formData, "name");
  const email = parseOptionalText(formData, "email");

  if (!organisation || !name || !email) {
    redirect(buildPartnershipLeadPath({ leadId, notice: "missing-fields" }));
  }

  const orgType = parseOptionalText(formData, "org_type") || null;
  const focusAreas = parseOptionalText(formData, "focus_areas") || null;
  const budgetRange = parseOptionalText(formData, "budget_range") || null;
  const successDefinition = parseOptionalText(formData, "success_definition") || null;
  const supportType = parseOptionalText(formData, "support_type") || null;

  let existingLead = null;

  if (leadId) {
    const { data } = await supabase
      .from("partnership_leads")
      .select("id, slug, created_by_user_id")
      .eq("id", leadId)
      .maybeSingle();

    existingLead = data || null;

    if (!existingLead) {
      redirect(buildPartnershipLeadPath({ notice: "error" }));
    }
  }

  const slug = await ensureUniqueSlug({
    currentLeadId: leadId,
    initialSlug: existingLead?.slug || createPartnershipLeadSlug(organisation),
    supabase,
  });

  const payload = {
    organisation,
    name,
    email,
    org_type: orgType,
    focus_areas: focusAreas,
    budget_range: budgetRange,
    status: normaliseLeadStatus(formData.get("status")),
    assigned_to_user_id: parseOptionalText(formData, "assigned_to_user_id") || null,
    success_definition: successDefinition,
    support_type: supportType,
    updated_by_user_id: user.id,
    ...(existingLead ? { created_by_user_id: existingLead.created_by_user_id } : { created_by_user_id: user.id }),
  };

  const query = leadId
    ? supabase.from("partnership_leads").update(payload).eq("id", leadId)
    : supabase.from("partnership_leads").insert(payload);

  const { data, error } = await query.select("id").single();

  if (error || !data?.id) {
    redirect(buildPartnershipLeadPath({ leadId, notice: "error" }));
  }

  redirect(buildPartnershipLeadPath({ leadId: data.id, notice: "saved" }));
}

export async function deleteAdminPartnershipLeadAction(formData) {
  const { supabase } = await requireAdminContext();
  const leadId = String(formData.get("lead_id") || "");

  if (!leadId) {
    return redirect("/admin/leads?notice=error");
  }

  const { error } = await supabase.from("partnership_leads").delete().eq("id", leadId);

  if (error) {
    return redirect("/admin/leads?notice=error");
  }

  return redirect("/admin/leads?notice=deleted");
}