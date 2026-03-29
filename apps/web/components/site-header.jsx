"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { siteNavigation } from "@/lib/patna-data";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <BrandLogo href="/" label="The PATNA Initiative" size="sm" variant="full" />

      <nav className="site-nav" aria-label="Primary">
        {siteNavigation.map((item) => {
          const isActive =
            item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link className={isActive ? "active" : undefined} href={item.href} key={item.href}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="site-header-actions">
        <Link className="pill-link" href="/auth/login">
          Member Login
        </Link>
        <Link className="primary-button" href="/community/join">
          Join Community
        </Link>
      </div>
    </header>
  );
}
