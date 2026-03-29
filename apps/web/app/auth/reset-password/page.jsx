import { BrandLogo } from "@/components/brand-logo";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">Secure setup</div>
          <h1>Set your PATNA password</h1>
          <p>
            This step completes your invite or reset flow and returns you to PATNA onboarding for
            any missing profile details.
          </p>
        </article>

        <div className="auth-form-panel">
          <ResetPasswordForm />
        </div>
      </div>
    </section>
  );
}
