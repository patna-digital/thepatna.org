"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

export async function submitPartnershipEnquiryAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return { status: "error", message: "Service is not available. Please email us directly." };
  }

  const organisation = parseText(formData, "organisation");
  const name = parseText(formData, "name");
  const email = parseText(formData, "email");

  if (!organisation || !name || !email) {
    return { status: "error", message: "Organisation, name, and email are required." };
  }

  const orgType = parseText(formData, "org_type") || null;
  const focusAreas = parseText(formData, "focus_areas") || null;
  const budgetRange = parseText(formData, "budget_range") || null;
  const successDefinition = parseText(formData, "success_definition") || null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("partnership_leads").insert({
    organisation,
    name,
    email,
    org_type: orgType,
    focus_areas: focusAreas,
    budget_range: budgetRange,
    success_definition: successDefinition,
    status: "new",
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again or email us directly." };
  }

  return { status: "success", message: "Thank you — your enquiry has been received. PATNA will be in touch shortly." };
}
