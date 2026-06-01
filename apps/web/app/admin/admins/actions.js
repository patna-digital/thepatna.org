"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdminContext } from "@/lib/supabase/access";
import { sendEmail } from "@/lib/email/resend";
import { adminWelcomeEmailHtml } from "@/lib/email/templates/admin-welcome";
import { getSiteUrl } from "@/lib/env";

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
    const { data: existingPreApproval } = await adminClient
      .from("pre_approved_admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingPreApproval) {
      redirect("/admin/admins?notice=already-pre-approved");
    }

    const { error: preApproveError } = await adminClient
      .from("pre_approved_admins")
      .insert({ email, added_by_user_id: user.id });

    if (preApproveError) {
      redirect("/admin/admins?notice=error");
    }

    redirect("/admin/admins?notice=pre-approved");
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

  // Fetch granter profile for the welcome email
  const { data: granter } = await adminClient
    .from("profiles")
    .select("first_name, surname")
    .eq("id", user.id)
    .maybeSingle();

  const recipientName = [profile.first_name, profile.surname].filter(Boolean).join(" ") || profile.email;
  const granterName = granter
    ? [granter.first_name, granter.surname].filter(Boolean).join(" ") || "A super admin"
    : "A super admin";

  // Send welcome email (non-fatal)
  try {
    await sendEmail({
      to: profile.email,
      subject: "You have been granted admin access to PATNA",
      html: adminWelcomeEmailHtml({
        recipientName,
        granterName,
        adminLink: `${getSiteUrl()}/admin`,
      }),
    });
  } catch (emailError) {
    console.error("grantAdminRoleAction welcome email error:", emailError);
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

export async function revokePreApprovedAdminAction(formData) {
  await requireSuperAdminContext();
  const adminClient = createSupabaseAdminClient();

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/admins?notice=missing-fields");
  }

  const { error } = await adminClient
    .from("pre_approved_admins")
    .delete()
    .eq("email", email);

  if (error) {
    redirect("/admin/admins?notice=error");
  }

  redirect("/admin/admins?notice=pre-approved-removed");
}
