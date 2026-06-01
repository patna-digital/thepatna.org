"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

export async function submitCollaborationProposalAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return { status: "error", message: "Service is not available. Please email us directly." };
  }

  const organisation = parseText(formData, "organisation");
  const name = parseText(formData, "name");
  const email = parseText(formData, "email");
  const proposal = parseText(formData, "proposal");

  if (!organisation || !name || !email || !proposal) {
    return { status: "error", message: "Organisation, name, email, and proposal are required." };
  }

  const collaborationType = parseText(formData, "collaboration_type") || null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("collaboration_leads").insert({
    organisation,
    name,
    email,
    collaboration_type: collaborationType,
    proposal,
    status: "new",
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again or email us directly." };
  }

  return { status: "success", message: "Thank you — your proposal has been received. PATNA will be in touch to discuss next steps." };
}
