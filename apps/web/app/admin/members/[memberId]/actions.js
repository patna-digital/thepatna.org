"use server";

import { redirect } from "next/navigation";
import { replaceMemberHeadshot, replaceMemberResume } from "@/lib/member-profile-updates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

function buildReturnPath(memberId, notice) {
  const params = new URLSearchParams();

  if (notice) {
    params.set("notice", notice);
  }

  const query = params.toString();
  return query ? `/admin/members/${memberId}?${query}` : `/admin/members/${memberId}`;
}

export async function replaceMemberHeadshotAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const memberId = String(formData.get("member_id") || "").trim();
  const headshotFile = formData.get("headshot_file");

  if (!memberId) {
    redirect("/admin/members");
  }

  const result = await replaceMemberHeadshot({
    adminSupabase: adminClient,
    file: typeof headshotFile?.arrayBuffer === "function" ? headshotFile : null,
    updatedByUserId: user.id,
    userId: memberId,
  });

  if (!result.ok) {
    const notice =
      result.reason === "missing-file"
        ? "headshot-missing-file"
        : result.reason === "file-too-large"
          ? "headshot-file-too-large"
          : "headshot-error";

    redirect(buildReturnPath(memberId, notice));
  }

  redirect(buildReturnPath(memberId, "headshot-updated"));
}

export async function replaceMemberResumeAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const memberId = String(formData.get("member_id") || "").trim();
  const resumeFile = formData.get("cv_file");

  if (!memberId) {
    redirect("/admin/members");
  }

  const result = await replaceMemberResume({
    adminSupabase: adminClient,
    file: typeof resumeFile?.arrayBuffer === "function" ? resumeFile : null,
    updatedByUserId: user.id,
    userId: memberId,
  });

  if (!result.ok) {
    const notice =
      result.reason === "missing-file"
        ? "resume-missing-file"
        : result.reason === "file-too-large"
          ? "resume-file-too-large"
          : "resume-error";

    redirect(buildReturnPath(memberId, notice));
  }

  redirect(buildReturnPath(memberId, "resume-updated"));
}

export async function updateMemberProfileStatusAction(formData) {
  const { supabase } = await requireAdminContext();
  const memberId = String(formData.get("member_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();

  if (!memberId || !["active", "inactive"].includes(nextStatus)) {
    redirect("/admin/members");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ profile_status: nextStatus })
    .eq("id", memberId);

  if (error) {
    redirect(buildReturnPath(memberId, "profile-status-error"));
  }

  redirect(buildReturnPath(memberId, "profile-status-updated"));
}
