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

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next") || "/app");
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

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

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && type) {
    await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
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

    if (type === "recovery") {
      return redirectWithCookies(new URL("/auth/reset-password", request.url), response);
    }

    return redirectWithCookies(new URL("/app", request.url), response);
  }

  return response;
}
