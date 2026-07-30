"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyAdminsOfNewLead } from "@/lib/lead-notifications";

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

  await notifyAdminsOfNewLead(supabase, {
    subject: `New PATNA partnership enquiry: ${organisation}`,
    heading: "New partnership enquiry received",
    fields: [
      { label: "Organisation", value: organisation },
      { label: "Contact name", value: name },
      { label: "Email", value: email },
      { label: "Organisation type", value: orgType },
      { label: "Focus areas", value: focusAreas },
      { label: "Budget range", value: budgetRange },
    ],
    detailLabel: "Success definition",
    detailText: successDefinition,
    reviewPath: "/admin/partnership-leads",
  });

  return { status: "success", message: "Thank you — your enquiry has been received. PATNA will be in touch shortly." };
}
