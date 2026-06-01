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

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    console.error("Failed to create Supabase server client during sign-in.", error);
    return {
      status: "error",
      message: "We could not complete sign-in right now. Please try again.",
    };
  }

  let error;

  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    error = response.error;
  } catch (authError) {
    console.error("Unexpected sign-in failure.", authError);
    return {
      status: "error",
      message: "We could not complete sign-in right now. Please try again.",
    };
  }

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await markOnboardingStarted(supabase, user.id);
    }
  } catch (postSignInError) {
    console.error("Post sign-in onboarding sync failed.", postSignInError);
  }

  redirect(nextPath);
}
