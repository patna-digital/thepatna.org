"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/sign-out-button";
import { memberNav } from "@/lib/patna-data";

export function DashboardShell({
  title,
  subtitle,
  children,
  navItems = memberNav,
  brandHref = "/app",
  brandLabel = "PATNA Community",
  eyebrow = "Member workspace",
  spotlight,
}) {
  const pathname = usePathname();
  const footerLinks = [
    { href: "/app", label: "Community App" },
    { href: "/admin", label: "Admin App" },
    { href: "/", label: "Website" },
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <BrandLogo
            href={brandHref}
            label={brandLabel}
            showCopy={false}
            theme="sidebar"
            variant="mark"
          />
          <div className="dashboard-sidebar-branding">
            <strong className="dashboard-sidebar-title">{brandLabel}</strong>
            <p className="dashboard-sidebar-copy">
              Secure coordination spaces for cohort work, knowledge exchange, and review
              workflows.
            </p>
          </div>
        </div>

        <nav aria-label="Member navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === "/app" || item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link className={isActive ? "active" : undefined} href={item.href} key={item.href}>
                <span className="nav-item-label">
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-spotlight">
          <div className="dashboard-spotlight-label">{spotlight?.label || "Workspace"}</div>
          <strong>{spotlight?.title || "Community platform in motion"}</strong>
          <p>
            {spotlight?.body ||
              "The workspace is organised for coordination, review, and evidence-led action across PATNA."}
          </p>
        </div>

        <div className="sidebar-cross-nav">
          <div className="sidebar-cross-nav-label">Navigate to</div>
          <Link className="sidebar-cross-nav-link" href="/">
            <span>Website</span>
            <span className="sidebar-cross-nav-arrow">↗</span>
          </Link>
          <Link className="sidebar-cross-nav-link" href="/app">
            <span>Community app</span>
            <span className="sidebar-cross-nav-arrow">↗</span>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          <section className="dashboard-overview">
            <div className="section-label">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </section>
          {children}

          <footer className="dashboard-footer">
            <div>
              <strong>Navigate across PATNA</strong>
              <p>Move between the community workspace, admin workspace, and public website.</p>
            </div>

            <div className="dashboard-footer-links">
              {footerLinks.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    className={isActive ? "workspace-link active-filter" : "workspace-link"}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
