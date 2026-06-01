import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset Password - The PATNA Initiative",
  description: "Reset your PATNA account password",
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">{t("forgotPassword.eyebrow")}</div>
          <h1>{t("forgotPassword.h1")}</h1>
          <p>{t("forgotPassword.intro")}</p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/auth/login">
              {t("forgotPassword.btnBackToSignin")}
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
