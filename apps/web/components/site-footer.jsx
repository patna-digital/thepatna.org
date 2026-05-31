import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";
import { footerLinkGroups } from "@/lib/patna-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <BrandLogo href="/" label="The PATNA Initiative" size="md" theme="footer" variant="full" />
            <div className="footer-brand-full">
              Professional African Technical Network Advisory Initiative
            </div>
            <p>
              PATNA is Africa&apos;s technical and diplomatic institution for maritime
              decarbonisation — building the evidence, capacity, and coalition strength for
              African countries to lead in global climate governance.
            </p>
            <p>www.thepatna.org · contact@thepatna.org</p>
          </div>

          {footerLinkGroups.map((group) => (
            <div className="footer-col" key={group.title}>
              <h5>{group.title}</h5>
              {group.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PATNA Initiative. All rights reserved. · contact@thepatna.org</p>
          <div className="footer-langs">
            <LanguageSelector variant="compact" />
            <Link href="/contact">Contact</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
