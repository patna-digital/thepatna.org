import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }) {
  const t = await getTranslations();
  const resolvedSearchParams = await searchParams;
  const next = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/app";

  return (
    <section className="auth-shell">
      <div className="auth-grid">
        <article className="auth-panel">
          <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />
          <div className="eyebrow">{t("loginPage.eyebrow")}</div>
          <h1>{t("loginPage.h1")}</h1>
          <p>{t("loginPage.intro")}</p>
          <div className="hero-actions">
            <Link className="secondary-button" href="/community/join">
              {t("loginPage.btnNeedInvite")}
            </Link>
          </div>
        </article>

        <div className="auth-form-panel">
          <LoginForm next={next} />
          <p className="muted-note" style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.75rem" }}>
            {t("loginPage.termsText")}{" "}
            <Link href="/legal/terms">{t("loginPage.termsOfService")}</Link>
            {" "}and{" "}
            <Link href="/legal/privacy">{t("loginPage.privacyPolicy")}</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
