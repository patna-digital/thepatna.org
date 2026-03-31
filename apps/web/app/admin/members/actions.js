"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/env";
import { createSupabaseAdminClient, listSupabaseAuthUsers } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

function createAuditInviteRow({ createdByUserId, email, method, userId }) {
  return {
    user_id: userId,
    created_by_user_id: createdByUserId,
    email,
    invite_token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    invite_type: "cohort_migration",
    delivery_method: method,
  };
}

function resolveReturnPath(formData) {
  const returnTo = String(formData.get("return_to") || "").trim();
  return returnTo.startsWith("/admin/members") ? returnTo : "/admin/members";
}

async function sendMemberAccessEmail({ adminClient, authUsers, createdByUserId, profile, supabase }) {
  const normalizedEmail = String(profile.email).trim().toLowerCase();
  const authUser = authUsers.find(
    (candidate) =>
      candidate.id === profile.id || String(candidate.email || "").trim().toLowerCase() === normalizedEmail,
  );

  let userId = authUser?.id || profile.id;
  let deliveryMethod = "manual_reset";

  if (!authUser) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (error) {
      throw error;
    }

    userId = data.user.id;
    deliveryMethod = "supabase_invite";
  } else {
    const { error } = await adminClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${getSiteUrl()}/auth/verify`,
    });

    if (error) {
      throw error;
    }
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ invited_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileUpdateError) {
    throw profileUpdateError;
  }

  const { error: inviteAuditError } = await supabase
    .from("invites")
    .insert(
      createAuditInviteRow({
        createdByUserId,
        email: normalizedEmail,
        method: deliveryMethod,
        userId,
      }),
    );

  if (inviteAuditError) {
    throw inviteAuditError;
  }
}

export async function sendMemberInviteAction(formData) {
  const { supabase, user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const authUsers = await listSupabaseAuthUsers(adminClient);
  const profileId = String(formData.get("profile_id") || "").trim();
  const returnPath = resolveReturnPath(formData);

  if (!profileId) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=missing-fields`);
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", profileId)
    .maybeSingle();

  if (profileLookupError || !profile?.email) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=error`);
  }

  try {
    await sendMemberAccessEmail({ adminClient, authUsers, createdByUserId: user.id, profile, supabase });
  } catch {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=error`);
  }

  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=sent`);
}

export async function sendSelectedMemberInvitesAction(formData) {
  const { supabase, user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const authUsers = await listSupabaseAuthUsers(adminClient);
  const returnPath = resolveReturnPath(formData);
  const profileIds = [...new Set(formData.getAll("profile_ids").map((value) => String(value || "").trim()).filter(Boolean))];

  if (profileIds.length === 0) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=missing-fields`);
  }

  const { data: profiles, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", profileIds);

  if (profileLookupError || !profiles?.length) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=error`);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const profile of profiles) {
    if (!profile?.email) {
      failedCount += 1;
      continue;
    }

    try {
      await sendMemberAccessEmail({ adminClient, authUsers, createdByUserId: user.id, profile, supabase });
      sentCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  const separator = returnPath.includes("?") ? "&" : "?";

  if (sentCount > 0 && failedCount === 0) {
    redirect(`${returnPath}${separator}notice=bulk-sent&sent=${sentCount}`);
  }

  if (sentCount > 0 && failedCount > 0) {
    redirect(`${returnPath}${separator}notice=bulk-partial&sent=${sentCount}&failed=${failedCount}`);
  }

  redirect(`${returnPath}${separator}notice=error`);
}

export async function updateMemberProfileStatusAction(formData) {
  const { supabase } = await requireAdminContext();
  const returnPath = resolveReturnPath(formData);
  const profileId = String(formData.get("profile_id") || "").trim();
  const nextStatus = String(formData.get("next_status") || "").trim();

  if (!profileId || !["active", "inactive"].includes(nextStatus)) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=error`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ profile_status: nextStatus })
    .eq("id", profileId);

  if (error) {
    redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=profile-status-error`);
  }

  redirect(
    `${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=profile-status-updated&profile_status=${nextStatus}`,
  );
}
