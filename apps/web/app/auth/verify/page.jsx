"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your request...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));

        // Supabase sends errors as hash params when a link is expired or invalid.
        const hashErrorCode = hashParams.get("error_code") || hashParams.get("error");
        if (hashErrorCode) {
          setStatus("error");
          if (hashErrorCode === "otp_expired") {
            setMessage("This link has expired. Ask your administrator to resend the invite from the Members page.");
          } else {
            setMessage("This link is invalid or has already been used. Ask your administrator to send a new one.");
          }
          return;
        }

        // inviteUserByEmail uses the implicit flow — tokens arrive as hash params
        // (#access_token=...&refresh_token=...&type=invite), not as query params.
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (hashAccessToken) {
          const supabase = createSupabaseBrowserClient();
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || "",
          });

          if (sessionError || !session) {
            setStatus("error");
            setMessage("Verification failed. This link may have already been used. Please request a new one.");
            return;
          }

          if (hashType === "invite" || hashType === "recovery") {
            router.push("/auth/reset-password");
          } else {
            router.push("/app");
          }
          return;
        }

        // PKCE / OTP flows send token_hash and type as query params.
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (!tokenHash || !type) {
          setStatus("error");
          setMessage("Invalid verification link. Please request a new one.");
          return;
        }

        const supabase = createSupabaseBrowserClient();

        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Verification failed. Please try again.");
          return;
        }

        if (type === "recovery" || type === "invite") {
          router.push("/auth/reset-password");
          return;
        }

        router.push("/app");
        
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">Authentication</div>
          <h1>
            {status === "processing" && "Verifying..."}
            {status === "error" && "Verification Failed"}
          </h1>
          <p>
            {status === "processing" && "Please wait while we verify your request."}
            {status === "error" && "We encountered an issue processing your request."}
          </p>
        </article>

        <div className="auth-form-panel">
          <div className="form-card">
            <h3>
              {status === "processing" && "Processing"}
              {status === "error" && "Error"}
            </h3>
            <p className={status === "error" ? "form-error" : "muted-note"}>
              {message}
            </p>
            {status === "error" && (
              <div className="form-footer-link">
                <Link href="/auth/login">← Back to sign in</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
