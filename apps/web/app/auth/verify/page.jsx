"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AUTH_ERROR_MESSAGES = {
  otp_expired:
    "This link has expired. Ask your administrator to resend the invite from the Members page.",
  access_denied: "This link is invalid or has already been used. Ask your administrator to send a new one.",
  missing_verification_params: "Invalid or missing verification parameters.",
};

function resolveAuthErrorMessage(code, description) {
  if (AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (description) {
    return description.replaceAll("+", " ");
  }

  return "This link is invalid or has already been used. Ask your administrator to send a new one.";
}

export default function AuthVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying your request...");

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.slice(1));

        const errorCode =
          hashParams.get("error_code") ||
          hashParams.get("error") ||
          params.get("error_code") ||
          params.get("error");
        const errorDescription =
          hashParams.get("error_description") || params.get("error_description");

        if (errorCode) {
          setStatus("error");
          setMessage(resolveAuthErrorMessage(errorCode, errorDescription));
          return;
        }

        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (code || (tokenHash && type)) {
          const callbackParams = new URLSearchParams(params);

          if (!callbackParams.get("next") && (code || type === "invite" || type === "recovery")) {
            callbackParams.set("next", "/auth/reset-password");
          }

          window.location.replace(`/auth/callback?${callbackParams.toString()}`);
          return;
        }

        // Legacy implicit-flow links arrive as hash params.
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

        if (!hashAccessToken) {
          setStatus("error");
          setMessage("Invalid or missing verification parameters.");
          return;
        }
        
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
