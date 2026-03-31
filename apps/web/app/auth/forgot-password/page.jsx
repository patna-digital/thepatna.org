import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset Password - The PATNA Initiative",
  description: "Reset your PATNA account password",
};

export default function ForgotPasswordPage() {
  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">Password Recovery</div>
          <h1>Reset your PATNA account password</h1>
          <p>
            Enter your email address to receive a password reset link. The link will be valid for a limited time.
          </p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/auth/login">
              Back to sign in
            </Link>
          </div>
        </article>

        <div className="auth-form-panel">
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
