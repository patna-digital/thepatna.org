import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { footerLinkGroups } from "@/lib/patna-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <BrandLogo href="/" label="The PATNA Initiative" size="md" theme="footer" variant="full" />
            <p>
              PATNA connects evidence, coordination, and institutional action for African climate,
              maritime, and energy transition leadership.
            </p>
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
          <p>© {new Date().getFullYear()} The PATNA Initiative · Built for African technical coordination, evidence, and collective positioning.</p>
          <div className="footer-langs">
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
