import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSafeRedirectPath } from "@/lib/auth";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { ensureProfileRecord } from "@/lib/supabase/access";

function redirectWithCookies(targetUrl, response) {
  const redirectResponse = NextResponse.redirect(targetUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

function normaliseAuthError(error) {
  const message = String(error?.message || "").trim();
  const lowerMessage = message.toLowerCase();

  if (error?.code === "otp_expired" || lowerMessage.includes("expired")) {
    return {
      code: "otp_expired",
      description:
        message || "This link has expired. Ask your administrator to resend the invite from the Members page.",
    };
  }

  return {
    code: error?.code || "access_denied",
    description: message || "This link is invalid or has already been used. Please request a new one.",
  };
}

function redirectToVerifyError(request, { code, description }) {
  const verifyUrl = new URL("/auth/verify", request.url);
  verifyUrl.searchParams.set("error_code", code);
  verifyUrl.searchParams.set("error_description", description);
  return NextResponse.redirect(verifyUrl);
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next") || "/app");
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const isPasswordSetupFlow = nextPath === "/auth/reset-password" || type === "recovery" || type === "invite";

  let response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.redirect(new URL(nextPath, request.url));

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let authError = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    authError = error;
  }

  if (authError) {
    return redirectToVerifyError(request, normaliseAuthError(authError));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await ensureProfileRecord({ supabase, user });

    if (profile?.onboarding_status === "invited") {
      await supabase
        .from("profiles")
        .update({ onboarding_status: "profile_pending" })
        .eq("id", user.id);
    }

    if (isPasswordSetupFlow) {
      return redirectWithCookies(new URL("/auth/reset-password", request.url), response);
    }

    return redirectWithCookies(new URL(nextPath, request.url), response);
  }

  if (code || (tokenHash && type)) {
    return redirectToVerifyError(request, {
      code: "access_denied",
      description: "This link is invalid or has already been used. Please request a new one.",
    });
  }

  return redirectToVerifyError(request, {
    code: "missing_verification_params",
    description: "Invalid or missing verification parameters.",
  });
}
