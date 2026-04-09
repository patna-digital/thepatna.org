"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildSpaceJoinRequestContext,
  isClosedSpaceJoinRequestStatus,
  parseSpaceJoinRequestDetails,
} from "@/lib/space-join-requests";
import { SPACE_MEMBER_ROLES } from "@/lib/spaces";
import { requireAdminContext } from "@/lib/supabase/access";
import { addSpaceMember, updateSpaceMemberRole, removeSpaceMember } from "@/lib/spaces";

const SPACE_MEMBER_ROLE_VALUES = new Set(SPACE_MEMBER_ROLES.map((role) => role.value));

function normaliseSpaceRole(value) {
  const role = String(value || "member").trim().toLowerCase();
  return SPACE_MEMBER_ROLE_VALUES.has(role) ? role : "member";
}

export async function addSpaceMemberAction(spaceId, formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const userId = String(formData.get("user_id") || "").trim();
  const role = normaliseSpaceRole(formData.get("role"));

  if (!userId) {
    return { ok: false, error: "Please select a member to add" };
  }

  const { error } = await addSpaceMember({
    adminSupabase: adminClient,
    spaceId,
    userId,
    role,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This member is already in the space" };
    }
    return { ok: false, error: error.message || "Failed to add member" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}

export async function updateMemberRoleAction(spaceId, formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const userId = String(formData.get("user_id") || "").trim();
  const role = normaliseSpaceRole(formData.get("role"));

  if (!userId) {
    return { ok: false, error: "User ID is required" };
  }

  const { error } = await updateSpaceMemberRole({
    adminSupabase: adminClient,
    spaceId,
    userId,
    role,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update role" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}

export async function removeSpaceMemberAction(spaceId, userId) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const { error } = await removeSpaceMember({
    adminSupabase: adminClient,
    spaceId,
    userId,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to remove member" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  return { ok: true };
}

export async function approveSpaceJoinRequestAction(spaceId, formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const requestId = String(formData.get("request_id") || "").trim();
  const role = normaliseSpaceRole(formData.get("role"));

  if (!requestId) {
    return { ok: false, error: "Request is required" };
  }

  const { data: request, error: requestLookupError } = await adminClient
    .from("service_requests")
    .select("id, details, status")
    .eq("id", requestId)
    .eq("decision_context", buildSpaceJoinRequestContext(spaceId))
    .maybeSingle();

  if (requestLookupError || !request) {
    return { ok: false, error: "Join request could not be found" };
  }

  if (isClosedSpaceJoinRequestStatus(request.status)) {
    return { ok: false, error: "This join request has already been processed" };
  }

  const joinRequest = parseSpaceJoinRequestDetails(request.details);
  const userId = String(joinRequest.requesterUserId || "").trim();

  if (!userId) {
    return { ok: false, error: "The requester account could not be linked automatically" };
  }

  const { error: membershipError } = await addSpaceMember({
    adminSupabase: adminClient,
    spaceId,
    userId,
    role,
  });

  if (membershipError && membershipError.code !== "23505") {
    return { ok: false, error: membershipError.message || "Failed to approve join request" };
  }

  const { error: requestError } = await adminClient
    .from("service_requests")
    .update({
      assigned_to_user_id: user.id,
      status: "closed",
    })
    .eq("id", requestId);

  if (requestError) {
    return { ok: false, error: requestError.message || "Failed to close join request" };
  }

  revalidatePath(`/admin/spaces/${spaceId}/members`);
  revalidatePath("/app");
  revalidatePath("/app/spaces");
  return { ok: true };
}
