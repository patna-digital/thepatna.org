"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";
import { siteNavigation } from "@/lib/patna-data";

// Maps nav href → translation key in the 'nav' namespace
const NAV_KEY = {
  "/": "home",
  "/about": "about",
  "/projects": "projects",
  "/publications": "publications",
  "/events": "events",
  "/community": "community",
  "/work-with-us": "workWithUs",
  "/contact": "contact",
  "/insights": "insights",
};

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />

        {/* Desktop nav — hidden on mobile via CSS */}
        <nav className="site-nav" aria-label="Primary">
          {siteNavigation.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            const key = NAV_KEY[item.href];
            return (
              <Link className={isActive ? "active" : undefined} href={item.href} key={item.href}>
                {key ? t(`nav.${key}`) : item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions — hidden on mobile via CSS */}
        <div className="site-header-actions">
          <LanguageSelector variant="compact" />
          <Link className="pill-link" href="/auth/login">
            {t("auth.login")}
          </Link>
          <Link className="primary-button" href="/community/join">
            {t("auth.join")}
          </Link>
        </div>

        {/* Mobile controls: language selector + hamburger */}
        <div className="site-header-mobile-controls">
          <LanguageSelector variant="compact" />
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="site-header-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="site-mobile-nav open"
        >
          {siteNavigation.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
            const key = NAV_KEY[item.href];
            return (
              <Link
                className={isActive ? "active" : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {key ? t(`nav.${key}`) : item.label}
              </Link>
            );
          })}
          <div className="site-mobile-nav-actions">
            <Link className="pill-link" href="/auth/login" onClick={() => setMenuOpen(false)}>
              {t("auth.login")}
            </Link>
            <Link className="primary-button" href="/community/join" onClick={() => setMenuOpen(false)}>
              {t("auth.join")}
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
