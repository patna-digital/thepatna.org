"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseMemberProfileFormData,
  persistMemberProfile,
  replaceMemberHeadshot,
} from "@/lib/member-profile-updates";
import { normaliseProfileSectionId } from "@/lib/profile-onboarding";
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
  const result = await persistMemberProfile({
    adminSupabase,
    supabase,
    userId: user.id,
    values,
  });

  if (!result.ok) {
    if (result.reason === "invalid-selection") {
      redirect(buildProfileRedirect({ editMode: true, notice: "invalid-selection", step: activeStep }));
    }

    redirect(buildProfileRedirect({ editMode: true, notice: "save-error", step: activeStep }));
  }

  redirect(buildProfileRedirect({ editMode: true, notice: "saved", step: activeStep }));
}

export async function replaceOwnHeadshotAction(formData) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/profile");
  }

  const adminClient = createSupabaseAdminClient();
  const headshotFile = formData.get("headshot_file");
  const result = await replaceMemberHeadshot({
    adminSupabase: adminClient,
    file: typeof headshotFile?.arrayBuffer === "function" ? headshotFile : null,
    updatedByUserId: user.id,
    userId: user.id,
  });

  if (!result.ok) {
    const notice =
      result.reason === "missing-file"
        ? "headshot-missing-file"
        : result.reason === "file-too-large"
          ? "headshot-file-too-large"
          : "headshot-error";

    redirect(buildProfileRedirect({ notice }));
  }

  const { data: bookingSettings } = await supabase
    .from("booking_settings")
    .select("public_booking_url_slug")
    .eq("member_id", user.id)
    .maybeSingle();

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/members");
  revalidatePath("/app/calendar");

  if (bookingSettings?.public_booking_url_slug) {
    revalidatePath(`/book/${bookingSettings.public_booking_url_slug}`);
  }

  redirect(buildProfileRedirect({ notice: "headshot-updated" }));
}
