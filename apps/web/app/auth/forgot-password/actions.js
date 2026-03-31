"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";

export async function forgotPasswordAction(_previousState, formData) {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase is not configured in the environment yet. Add your project URL and anon key before testing.",
    };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    return {
      status: "error",
      message: "Email is required.",
    };
  }

  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback`,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "If an account exists with this email, you will receive a password reset link.",
  };
}
