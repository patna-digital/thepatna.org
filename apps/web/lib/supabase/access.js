import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getProfileRecord(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return profile ?? null;
}

export async function markOnboardingStarted(supabase, userId) {
  const profile = await getProfileRecord(supabase, userId);

  if (!profile || profile.onboarding_status !== "invited") {
    return profile;
  }

  const { data: updatedProfile } = await supabase
    .from("profiles")
    .update({
      onboarding_status: "profile_pending",
    })
    .eq("id", userId)
    .select("*")
    .single();

  return updatedProfile ?? profile;
}

export async function getCurrentUserContext({
  includeProfile = true,
  includeRoles = true,
} = {}) {
  if (!isSupabaseConfigured()) {
    return {
      supabase: null,
      user: null,
      profile: null,
      roles: [],
      isAdmin: false,
      needsOnboarding: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      roles: [],
      isAdmin: false,
      needsOnboarding: false,
    };
  }

  const [profile, roleRowsResult] = await Promise.all([
    includeProfile ? getProfileRecord(supabase, user.id) : Promise.resolve(null),
    includeRoles
      ? supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const roles = includeRoles ? roleRowsResult?.data?.map((item) => item.role) ?? [] : [];
  const needsOnboarding = includeProfile ? profile?.onboarding_status !== "active" : false;

  return {
    supabase,
    user,
    profile,
    roles,
    isAdmin: roles.includes("administrator"),
    needsOnboarding,
  };
}

export async function requireAdminContext() {
  const context = await getCurrentUserContext({ includeProfile: false, includeRoles: true });

  if (!context.user) {
    redirect("/auth/login?next=/admin");
  }

  if (!context.isAdmin) {
    redirect("/app");
  }

  return context;
}
