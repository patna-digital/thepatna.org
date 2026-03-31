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
        // Parse the URL fragment (hash) which contains token_hash and type
        const hash = window.location.hash.slice(1);
        
        if (!hash) {
          setStatus("error");
          setMessage("Invalid or missing verification parameters.");
          return;
        }

        const params = new URLSearchParams(hash);
        const tokenHash = params.get("token_hash");
        const type = params.get("type");

        if (!tokenHash || !type) {
          setStatus("error");
          setMessage("Invalid verification link. Please request a new one.");
          return;
        }

        const supabase = createSupabaseBrowserClient();

        // Verify the OTP token
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Verification failed. Please try again.");
          return;
        }

        // For recovery/invite flows, redirect to reset-password page
        if (type === "recovery" || type === "invite") {
          router.push("/auth/reset-password");
          return;
        }

        // For other flows, redirect to app
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
