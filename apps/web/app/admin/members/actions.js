"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { syncProfileAssistantDocument } from "@/lib/assistant-indexing";
import { sendAccessSetupEmail } from "@/lib/access-emails";
import { provisionMemberFromApplication } from "@/lib/member-provisioning";
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

function getSelectedProfileIds(formData) {
  return [
    ...new Set(
      formData
        .getAll("profile_ids")
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
}

async function sendMemberAccessEmail({ adminClient, authUsers, createdByUserId, profile, supabase }) {
  const normalizedEmail = String(profile.email).trim().toLowerCase();
  const { deliveryMethod, userId } = await sendAccessSetupEmail({
    adminClient,
    authUsers,
    email: normalizedEmail,
    profileId: profile.id || "",
  });

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, email: normalizedEmail, invited_at: new Date().toISOString() },
      { onConflict: "id" },
    );

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
    await sendMemberAccessEmail({
      adminClient,
      authUsers: null,
      createdByUserId: user.id,
      profile,
      supabase,
    });
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
  const profileIds = getSelectedProfileIds(formData);

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

export async function repairSelectedMemberProfilesAction(formData) {
  const { supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const returnPath = resolveReturnPath(formData);
  const profileIds = getSelectedProfileIds(formData);

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

  let repairedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const profile of profiles) {
    if (!profile?.id || !profile?.email) {
      failedCount += 1;
      continue;
    }

    try {
      const result = await provisionMemberFromApplication({
        adminClient,
        email: profile.email,
        userId: profile.id,
        defaultOnboardingStatus: "active",
      });

      if (result.status === "repaired") {
        repairedCount += 1;
      } else {
        skippedCount += 1;
      }
    } catch {
      failedCount += 1;
    }
  }

  const separator = returnPath.includes("?") ? "&" : "?";

  redirect(
    `${returnPath}${separator}notice=repair-summary&repaired=${repairedCount}&skipped=${skippedCount}&failed=${failedCount}`,
  );
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

  try {
    await syncProfileAssistantDocument({ profileId });
  } catch (assistantError) {
    console.error("updateMemberProfileStatusAction assistant sync error:", assistantError);
  }

  redirect(
    `${returnPath}${returnPath.includes("?") ? "&" : "?"}notice=profile-status-updated&profile_status=${nextStatus}`,
  );
}
