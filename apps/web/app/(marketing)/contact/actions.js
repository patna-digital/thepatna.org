"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

export async function submitContactEnquiryAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return { status: "error", message: "Service is not available. Please email us directly." };
  }

  const name = parseText(formData, "requester_name");
  const email = parseText(formData, "requester_email");
  const details = parseText(formData, "details");

  if (!name || !email || !details) {
    return { status: "error", message: "Name, email, and message are required." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("service_requests").insert({
    requester_name: name,
    requester_email: email,
    organisation: parseText(formData, "organisation") || null,
    request_type: "contact",
    details,
    status: "new",
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again or email us directly." };
  }

  return { status: "success", message: "Thank you — your message has been received. PATNA will be in touch shortly." };
}
