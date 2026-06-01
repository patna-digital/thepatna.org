"use server";

import { getAuthCallbackUrl } from "@/lib/auth";
import { syncProfileAssistantDocument } from "@/lib/assistant-indexing";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { getSiteUrl } from "@/lib/env";
import { revalidatePath } from "next/cache";
import {
  VALID_PROFILE_AVAILABILITY_STATUSES,
  VALID_PROFILE_VISIBILITY_SETTINGS,
} from "@/lib/profile-form-options";
import { updatePreferences } from "@/lib/notifications";

const VALID_DIGEST_FREQUENCIES = ["daily", "weekly", "never"];
const BOOLEAN_PREF_KEYS = [
  "email_digest_enabled",
  "email_mentions_enabled",
  "email_broadcasts_enabled",
  "inapp_mentions_enabled",
];

export async function updateVisibilitySettingAction(formData) {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const visibility = String(formData.get("visibility_setting") || "").trim();

  if (!VALID_PROFILE_VISIBILITY_SETTINGS.includes(visibility)) {
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

  try {
    await syncProfileAssistantDocument({ profileId: user.id });
  } catch (assistantError) {
    console.error("Failed to sync assistant profile after visibility update:", assistantError);
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

  if (!VALID_PROFILE_AVAILABILITY_STATUSES.includes(availability)) {
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

  try {
    await syncProfileAssistantDocument({ profileId: user.id });
  } catch (assistantError) {
    console.error("Failed to sync assistant profile after availability update:", assistantError);
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

  try {
    await syncProfileAssistantDocument({ profileId: user.id });
  } catch (assistantError) {
    console.error("Failed to sync assistant profile after timezone update:", assistantError);
  }

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updateNotificationPreferenceAction(formData) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });
  if (!user || !supabase) return { ok: false, error: "Unauthorized" };

  const key = String(formData.get("key") || "").trim();
  const value = formData.get("value");

  if (!BOOLEAN_PREF_KEYS.includes(key)) {
    return { ok: false, error: "Invalid preference key" };
  }

  // Checkbox: "on" when checked, absent when unchecked
  const boolValue = value === "on" || value === "true";

  try {
    await updatePreferences({ supabase, userId: user.id, prefs: { [key]: boolValue } });
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    console.error("updateNotificationPreferenceAction error:", err);
    return { ok: false, error: "Failed to save preference" };
  }
}

export async function updateDigestFrequencyAction(formData) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });
  if (!user || !supabase) return { ok: false, error: "Unauthorized" };

  const frequency = String(formData.get("email_digest_frequency") || "").trim();
  if (!VALID_DIGEST_FREQUENCIES.includes(frequency)) {
    return { ok: false, error: "Invalid frequency" };
  }

  try {
    await updatePreferences({ supabase, userId: user.id, prefs: { email_digest_frequency: frequency } });
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    console.error("updateDigestFrequencyAction error:", err);
    return { ok: false, error: "Failed to save frequency" };
  }
}

export async function requestPasswordResetAction() {
  const { user, supabase } = await getCurrentUserContext();

  if (!user || !supabase) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: getAuthCallbackUrl(getSiteUrl(), "/auth/reset-password"),
  });

  if (error) {
    console.error("Failed to send password reset:", error);
    return { ok: false, error: "Failed to send password reset email" };
  }

  return { ok: true, message: "Password reset email sent" };
}
