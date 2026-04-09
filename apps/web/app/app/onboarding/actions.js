"use server";

import { redirect } from "next/navigation";
import { parseMemberProfileFormData, persistMemberProfile } from "@/lib/member-profile-updates";
import { getNextProfileSectionId, normaliseProfileSectionId } from "@/lib/profile-onboarding";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function buildOnboardingRedirect({ notice = "", step = "" }) {
  const params = new URLSearchParams();

  if (step) {
    params.set("step", step);
  }

  if (notice) {
    params.set("notice", notice);
  }

  const query = params.toString();
  return query ? `/app/onboarding?${query}` : "/app/onboarding";
}

export async function saveOnboardingProfileAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/onboarding");
  }

  const values = parseMemberProfileFormData(formData);
  const adminSupabase = createSupabaseAdminClient();
  const activeStep = normaliseProfileSectionId(values.sectionId) || "identity-contact";
  const result = await persistMemberProfile({
    adminSupabase,
    supabase,
    userId: user.id,
    values,
  });

  if (!result.ok) {
    if (result.reason === "invalid-selection") {
      redirect(buildOnboardingRedirect({ notice: "invalid-selection", step: activeStep }));
    }

    redirect(buildOnboardingRedirect({ notice: "save-error", step: activeStep }));
  }

  if (values.intent === "continue") {
    const targetStep =
      normaliseProfileSectionId(values.nextStepId) ||
      getNextProfileSectionId(activeStep) ||
      result.firstIncompleteSection;
    redirect(buildOnboardingRedirect({ notice: "saved", step: targetStep }));
  }

  if (values.intent === "finish") {
    if (result.isComplete) {
      redirect("/app/onboarding/complete?notice=completed");
    }

    redirect(buildOnboardingRedirect({ notice: "saved", step: "review-confirm" }));
  }

  redirect(buildOnboardingRedirect({ notice: "saved", step: activeStep }));
}
