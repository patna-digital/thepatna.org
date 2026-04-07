import { getAuthCallbackUrl, getAuthVerifyUrl } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { listSupabaseAuthUsers } from "@/lib/supabase/admin";

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function resolveExistingAuthUser({
  adminClient,
  authUsers,
  email,
  profileId,
}) {
  const normalizedEmail = normaliseEmail(email);

  if (profileId) {
    const { data, error } = await adminClient.auth.admin.getUserById(profileId);

    if (!error && data?.user?.id) {
      return data.user;
    }
  }

  const availableAuthUsers = authUsers || (await listSupabaseAuthUsers(adminClient));

  return (
    availableAuthUsers.find(
      (candidate) => normaliseEmail(candidate.email) === normalizedEmail,
    ) || null
  );
}

export async function sendAccessSetupEmail({
  adminClient,
  authUsers = null,
  email,
  profileId = "",
}) {
  const normalizedEmail = normaliseEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  let authUser = await resolveExistingAuthUser({
    adminClient,
    authUsers,
    email: normalizedEmail,
    profileId,
  });

  if (!authUser) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: getAuthVerifyUrl(getSiteUrl(), "/auth/reset-password"),
    });

    if (!error) {
      return {
        deliveryMethod: "supabase_invite",
        userId: data.user.id,
      };
    }

    if (!String(error.message || "").toLowerCase().includes("already")) {
      throw error;
    }

    authUser = await resolveExistingAuthUser({
      adminClient,
      authUsers: null,
      email: normalizedEmail,
      profileId,
    });

    if (!authUser) {
      throw error;
    }
  }

  const { error } = await adminClient.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getAuthCallbackUrl(getSiteUrl(), "/auth/reset-password"),
  });

  if (error) {
    throw error;
  }

  return {
    deliveryMethod: "manual_reset",
    userId: authUser?.id || profileId || null,
  };
}
