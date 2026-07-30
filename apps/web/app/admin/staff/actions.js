"use server";

import { redirect } from "next/navigation";
import { requireAdminContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function grantStaffRoleAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const lineManagerId = String(formData.get("line_manager_id") || "").trim();

  if (!email || !lineManagerId) {
    redirect("/admin/staff?notice=missing-fields");
  }

  const { data: profile, error: lookupError } = await adminClient
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    redirect("/admin/staff?notice=error");
  }

  let targetUserId = profile?.id;

  if (!profile) {
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);

    if (inviteError || !inviteData?.user?.id) {
      redirect("/admin/staff?notice=invite-failed");
    }

    targetUserId = inviteData.user.id;
  }

  const { error: roleError } = await adminClient
    .from("user_roles")
    .upsert({ user_id: targetUserId, role: "staff" }, { onConflict: "user_id,role" });

  if (roleError) {
    redirect("/admin/staff?notice=error");
  }

  const { error: managerError } = await adminClient
    .from("profiles")
    .update({ line_manager_id: lineManagerId })
    .eq("id", targetUserId);

  if (managerError) {
    redirect("/admin/staff?notice=error");
  }

  redirect(profile ? "/admin/staff?notice=granted" : "/admin/staff?notice=invited");
}

export async function revokeStaffRoleAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const targetUserId = String(formData.get("user_id") || "").trim();

  if (!targetUserId) {
    redirect("/admin/staff?notice=missing-fields");
  }

  const { error } = await adminClient
    .from("user_roles")
    .delete()
    .eq("user_id", targetUserId)
    .eq("role", "staff");

  if (error) {
    redirect("/admin/staff?notice=error");
  }

  redirect("/admin/staff?notice=revoked");
}

export async function setLineManagerAction(formData) {
  await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const staffId = String(formData.get("staff_id") || "").trim();
  const lineManagerId = String(formData.get("line_manager_id") || "").trim();

  if (!staffId || !lineManagerId) {
    redirect(`/admin/staff/${staffId}?notice=missing-fields`);
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ line_manager_id: lineManagerId })
    .eq("id", staffId);

  if (error) {
    redirect(`/admin/staff/${staffId}?notice=error`);
  }

  redirect(`/admin/staff/${staffId}?notice=manager-updated`);
}
