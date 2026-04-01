import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const next = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/app";

  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">Member Access</div>
          <h1>Secure login for the PATNA community workspace</h1>
          <p>
            Sign in to access spaces, insights, members, onboarding, and PATNA review workflows.
            New members should begin with the community application form.
          </p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/community/join">
              Need an invite?
            </Link>
          </div>
        </article>

        <div className="auth-form-panel">
          <LoginForm next={next} />
          <p className="muted-note" style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.75rem" }}>
            By signing in you agree to our{" "}
            <Link href="/legal/terms">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
