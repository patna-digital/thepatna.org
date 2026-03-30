import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

const protectedPrefixes = ["/app", "/admin"];

function isProtectedPath(pathname) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname === "/auth/login" && user) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "administrator")
      .limit(1);

    if (!roles?.length) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/auth/login"],
};
