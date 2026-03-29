"use server";

import { redirect } from "next/navigation";
import { parseMemberProfileFormData, persistMemberProfile } from "@/lib/member-profile-updates";
import { getNextProfileSectionId, normaliseProfileSectionId } from "@/lib/profile-onboarding";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";

function buildProfileRedirect({ editMode = false, notice = "", step = "" }) {
  const params = new URLSearchParams();

  if (editMode) {
    params.set("edit", "1");
  }

  if (step) {
    params.set("step", step);
  }

  if (notice) {
    params.set("notice", notice);
  }

  const query = params.toString();
  return query ? `/app/profile?${query}` : "/app/profile";
}

export async function saveMemberProfileAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/profile");
  }

  const values = parseMemberProfileFormData(formData);
  const adminSupabase = createSupabaseAdminClient();
  const activeStep = normaliseProfileSectionId(values.sectionId) || "identity-contact";
  const editMode = values.flowMode !== "guided";
  const result = await persistMemberProfile({
    adminSupabase,
    supabase,
    userId: user.id,
    values,
  });

  if (!result.ok) {
    if (result.reason === "invalid-selection") {
      redirect(buildProfileRedirect({ editMode, notice: "invalid-selection", step: activeStep }));
    }

    redirect(buildProfileRedirect({ editMode, notice: "save-error", step: activeStep }));
  }

  if (values.flowMode === "guided") {
    if (values.intent === "continue") {
      const targetStep = normaliseProfileSectionId(values.nextStepId) || getNextProfileSectionId(activeStep) || result.firstIncompleteSection;
      redirect(buildProfileRedirect({ notice: "saved", step: targetStep }));
    }

    if (values.intent === "finish") {
      if (result.isComplete) {
        redirect(buildProfileRedirect({ notice: "completed" }));
      }

      redirect(buildProfileRedirect({ notice: "saved", step: result.firstIncompleteSection }));
    }

    redirect(buildProfileRedirect({ notice: "saved", step: activeStep }));
  }

  redirect(buildProfileRedirect({ notice: "saved" }));
}
