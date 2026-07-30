"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notifyAdminsOfNewLead } from "@/lib/lead-notifications";

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

export async function submitServiceRequestAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return { status: "error", message: "Service is not available. Please email us directly." };
  }

  const requesterName = parseText(formData, "requester_name");
  const requesterEmail = parseText(formData, "requester_email");
  const details = parseText(formData, "details");

  if (!requesterName || !requesterEmail || !details) {
    return { status: "error", message: "Name, email, and request details are required." };
  }

  const organisation = parseText(formData, "organisation") || null;
  const requestType = parseText(formData, "request_type") || null;
  const country = parseText(formData, "country") || null;
  const decisionContext = parseText(formData, "decision_context") || null;
  const timeline = parseText(formData, "timeline") || null;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("service_requests").insert({
    requester_name: requesterName,
    requester_email: requesterEmail,
    organisation,
    request_type: requestType,
    details,
    country,
    decision_context: decisionContext,
    timeline,
    status: "new",
  });

  if (error) {
    return { status: "error", message: "Something went wrong. Please try again or email us directly." };
  }

  await notifyAdminsOfNewLead(supabase, {
    subject: `New PATNA support request: ${requesterName}`,
    heading: "New support request received",
    fields: [
      { label: "Requester name", value: requesterName },
      { label: "Email", value: requesterEmail },
      { label: "Organisation", value: organisation },
      { label: "Request type", value: requestType },
      { label: "Country", value: country },
      { label: "Timeline", value: timeline },
    ],
    detailLabel: "Request details",
    detailText: details,
    reviewPath: "/admin/service-requests",
  });

  return { status: "success", message: "Thank you — your request has been received. PATNA will review it and be in touch shortly." };
}
