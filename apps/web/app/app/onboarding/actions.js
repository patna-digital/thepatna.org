"use server";

import { redirect } from "next/navigation";
import { parseMemberProfileFormData, persistMemberProfile } from "@/lib/member-profile-updates";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function saveOnboardingProfileAction(formData) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase || !canUseSupabaseAdmin()) {
    redirect("/auth/login?next=/app/profile");
  }

  const values = parseMemberProfileFormData(formData);
  const adminSupabase = createSupabaseAdminClient();
  const result = await persistMemberProfile({
    adminSupabase,
    supabase,
    userId: user.id,
    values,
  });

  if (!result.ok) {
    if (result.reason === "missing-fields") {
      redirect("/app/profile?notice=missing-fields");
    }

    if (result.reason === "invalid-selection") {
      redirect("/app/profile?notice=invalid-selection");
    }

    redirect("/app/profile?notice=save-error");
  }

  redirect("/app/profile?notice=saved");
}
