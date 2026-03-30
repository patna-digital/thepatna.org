"use server";

import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { markOnboardingStarted } from "@/lib/supabase/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAction(_previousState, formData) {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase is not configured in the environment yet. Add your project URL and anon key before testing login.",
    };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = getSafeRedirectPath(String(formData.get("next") || "/app"));

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await markOnboardingStarted(supabase, user.id);
  }

  redirect(nextPath);
}
