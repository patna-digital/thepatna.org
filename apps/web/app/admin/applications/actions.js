"use server";

import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/supabase/access";

export async function reviewApplicationAction(formData) {
  const { supabase, user } = await requireAdminContext();

  const applicationId = String(formData.get("application_id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const reviewNotes = String(formData.get("review_notes") || "").trim();

  if (!applicationId || !status) {
    redirect("/admin/applications?notice=missing-fields");
  }

  const { error } = await supabase
    .from("community_applications")
    .update({
      status,
      review_notes: reviewNotes || null,
      reviewed_by_user_id: user.id,
    })
    .eq("id", applicationId);

  if (error) {
    redirect(`/admin/applications?notice=error`);
  }

  redirect(`/admin/applications?notice=saved`);
}
