"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { revalidatePath } from "next/cache";

const VALID_VISIBILITY_SETTINGS = ["members_only", "public", "private"];
const VALID_AVAILABILITY_STATUSES = ["available", "limited", "unavailable"];

export async function updateVisibilitySettingAction(formData) {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const visibility = String(formData.get("visibility_setting") || "").trim();

  if (!VALID_VISIBILITY_SETTINGS.includes(visibility)) {
    return { ok: false, error: "Invalid visibility setting" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      visibility_setting: visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update visibility:", error);
    return { ok: false, error: "Failed to update visibility setting" };
  }

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updateAvailabilityStatusAction(formData) {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const availability = String(formData.get("availability_status") || "").trim();

  if (!VALID_AVAILABILITY_STATUSES.includes(availability)) {
    return { ok: false, error: "Invalid availability status" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      availability_status: availability,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update availability:", error);
    return { ok: false, error: "Failed to update availability status" };
  }

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updateTimezoneAction(formData) {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const timezone = String(formData.get("timezone") || "").trim();

  // Basic timezone validation (must contain a slash for region/city format)
  if (!timezone || !timezone.includes("/")) {
    return { ok: false, error: "Invalid timezone" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      timezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update timezone:", error);
    return { ok: false, error: "Failed to update timezone" };
  }

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function requestPasswordResetAction() {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/app/settings`,
  });

  if (error) {
    console.error("Failed to send password reset:", error);
    return { ok: false, error: "Failed to send password reset email" };
  }

  return { ok: true, message: "Password reset email sent" };
}
