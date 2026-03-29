import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getProfileRecord(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return profile ?? null;
}

function splitAuthName(user) {
  const explicitFirstName = String(user?.user_metadata?.first_name || "").trim();
  const explicitSurname = String(user?.user_metadata?.surname || "").trim();

  if (explicitFirstName || explicitSurname) {
    return {
      firstName: explicitFirstName || null,
      surname: explicitSurname || null,
    };
  }

  const fullName = String(user?.user_metadata?.full_name || user?.user_metadata?.name || "").trim();

  if (!fullName) {
    return {
      firstName: null,
      surname: null,
    };
  }

  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      surname: null,
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    surname: parts.at(-1) || null,
  };
}

export async function ensureProfileRecord({ supabase, user }) {
  if (!user?.id) {
    return null;
  }

  const existingProfile = await getProfileRecord(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const { firstName, surname } = splitAuthName(user);
  const profilePayload = {
    id: user.id,
    email: String(user.email || "").trim().toLowerCase(),
    first_name: firstName,
    surname,
    onboarding_status: "profile_pending",
  };

  const { data: selfCreatedProfile, error: selfCreateError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .single();

  if (!selfCreateError && selfCreatedProfile) {
    return selfCreatedProfile;
  }

  if (!canUseSupabaseAdmin()) {
    return null;
  }

  const adminClient = createSupabaseAdminClient();
  const { data: createdProfile, error } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return createdProfile ?? null;
}

export async function markOnboardingStarted(supabase, userId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile =
    (user?.id === userId ? await ensureProfileRecord({ supabase, user }) : null) ||
    (await getProfileRecord(supabase, userId));

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
    includeProfile ? ensureProfileRecord({ supabase, user }) : Promise.resolve(null),
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
