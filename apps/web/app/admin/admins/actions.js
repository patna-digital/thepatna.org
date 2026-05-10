"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdminContext } from "@/lib/supabase/access";

export async function grantAdminRoleAction(formData) {
  const { user } = await requireSuperAdminContext();
  const adminClient = createSupabaseAdminClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/admins?notice=missing-fields");
  }

  const { data: profile, error: lookupError } = await adminClient
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (lookupError || !profile) {
    redirect("/admin/admins?notice=not-found");
  }

  if (profile.id === user.id) {
    redirect("/admin/admins?notice=already-admin");
  }

  const { error: roleCheckError, data: existingRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", profile.id)
    .eq("role", "administrator")
    .maybeSingle();

  if (roleCheckError) {
    redirect("/admin/admins?notice=error");
  }

  if (existingRole) {
    redirect("/admin/admins?notice=already-admin");
  }

  const { error: insertError } = await adminClient
    .from("user_roles")
    .insert({ user_id: profile.id, role: "administrator" });

  if (insertError) {
    redirect("/admin/admins?notice=error");
  }

  redirect("/admin/admins?notice=granted");
}

export async function revokeAdminRoleAction(formData) {
  const { user } = await requireSuperAdminContext();
  const adminClient = createSupabaseAdminClient();

  const targetUserId = String(formData.get("user_id") || "").trim();

  if (!targetUserId) {
    redirect("/admin/admins?notice=missing-fields");
  }

  if (targetUserId === user.id) {
    redirect("/admin/admins?notice=cannot-remove-self");
  }

  // Prevent revoking the super admin's administrator role
  const { data: targetProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, is_super_admin")
    .eq("id", targetUserId)
    .maybeSingle();

  if (profileError || !targetProfile) {
    redirect("/admin/admins?notice=error");
  }

  if (targetProfile.is_super_admin) {
    redirect("/admin/admins?notice=cannot-remove-super-admin");
  }

  const { error: deleteError } = await adminClient
    .from("user_roles")
    .delete()
    .eq("user_id", targetUserId)
    .eq("role", "administrator");

  if (deleteError) {
    redirect("/admin/admins?notice=error");
  }

  redirect("/admin/admins?notice=revoked");
}
