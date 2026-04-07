"use server";

import { redirect } from "next/navigation";
import { finalizeMemberAccessAfterPasswordUpdate } from "@/lib/supabase/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updatePasswordAction(_previousState, formData) {
  const password = String(formData.get("password") || "");
  const passwordConfirmation = String(formData.get("password_confirmation") || "");

  if (!password || password.length < 10) {
    return {
      status: "error",
      message: "Use a password with at least 10 characters.",
    };
  }

  if (password !== passwordConfirmation) {
    return {
      status: "error",
      message: "Password confirmation does not match.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your reset session has expired. Request a new reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const accessResult = await finalizeMemberAccessAfterPasswordUpdate(supabase, user.id);

  redirect(accessResult.shouldRedirectToProfile ? "/app/profile" : "/app");
}
