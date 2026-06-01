import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";
import { footerLinkGroups } from "@/lib/patna-data";

export async function SiteFooter() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <BrandLogo href="/" label="The PATNA Initiative" size="md" theme="footer" variant="full" />
            <div className="footer-brand-full">
              {t("footer.brandFull")}
            </div>
            <p>{t("footer.tagline")}</p>
            <p>{t("footer.contactLine")}</p>
          </div>

          {footerLinkGroups.map((group) => (
            <div className="footer-col" key={group.title}>
              <h5>{t(group.titleKey)}</h5>
              {group.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>{t("footer.copyright", { year })}</p>
          <div className="footer-langs">
            <LanguageSelector variant="compact" />
            <Link href="/contact">{t("footer.linkContact")}</Link>
            <Link href="/legal/privacy">{t("footer.privacy")}</Link>
            <Link href="/legal/terms">{t("footer.terms")}</Link>
            <Link href="/legal">{t("footer.linkLegal")}</Link>
            <Link href="/admin">{t("footer.linkAdminLogin")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
