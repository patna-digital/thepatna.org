"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, ClipboardList, Users, Layers, CalendarCheck,
  FolderKanban, BookOpen, Wrench, Handshake, Network, Menu, X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";
import { SignOutButton } from "@/components/sign-out-button";
import { memberNav } from "@/lib/patna-data";

const ADMIN_ICON_MAP = {
  LayoutDashboard, ClipboardList, Users, Layers, CalendarCheck,
  FolderKanban, BookOpen, Wrench, Handshake, Network,
};

const ADMIN_NAV_KEY = {
  "/admin": "dashboard",
  "/admin/applications": "applications",
  "/admin/members": "members",
  "/admin/spaces": "spaces",
  "/admin/events": "events",
  "/admin/insights": "publications",
};

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
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  const footerLinks = [
    { href: "/app", label: "Community App" },
    { href: "/admin", label: "Admin App" },
    { href: "/", label: "Website" },
  ];

  return (
    <div className="dashboard-shell">
      <div className="mob-topbar mob-topbar--admin">
        <span className="mob-topbar-brand">{brandLabel}</span>
        <div className="mob-topbar-controls">
          <LanguageSelector variant="compact" />
          <button
            aria-controls="admin-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            className="mob-hamburger"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="mob-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`dashboard-sidebar${sidebarOpen ? " mob-open" : ""}`} id="admin-sidebar">
        <button
          aria-label="Close navigation menu"
          className="mob-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>

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

        {spotlight ? (
          <div className="dashboard-spotlight">
            <div className="dashboard-spotlight-label">{spotlight.label || "Workspace"}</div>
            <strong>{spotlight.title || "Community platform in motion"}</strong>
            <p>
              {spotlight.body ||
                "The workspace is organised for coordination, review, and evidence-led action across PATNA."}
            </p>
          </div>
        ) : null}

        <nav aria-label="Admin navigation">
          {navItems.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = ADMIN_ICON_MAP[item.icon];
                const isActive = mounted && (
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                );
                return (
                  <Link
                    className={[isActive ? "active" : "", item.highlight ? "nav-item-highlight" : ""].filter(Boolean).join(" ")}
                    href={item.href}
                    key={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-item-label">
                      <span className="nav-item-icon">{Icon && <Icon size={15} />}</span>
                      <span>{ADMIN_NAV_KEY[item.href] ? t(`member.${ADMIN_NAV_KEY[item.href]}`) : item.label}</span>
                    </span>
                    {item.badge ? <span className="badge">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <LanguageSelector variant="sidebar" />
          <div className="sidebar-cross-nav">
            <div className="sidebar-cross-nav-label">{t("nav_cross.navigateTo")}</div>
            <Link className="sidebar-cross-nav-link" href="/" onClick={() => setSidebarOpen(false)}>
              <span>{t("nav_cross.website")}</span>
              <span className="sidebar-cross-nav-arrow">↗</span>
            </Link>
            <Link className="sidebar-cross-nav-link" href="/app" onClick={() => setSidebarOpen(false)}>
              <span>{t("nav_cross.communityApp")}</span>
              <span className="sidebar-cross-nav-arrow">↗</span>
            </Link>
          </div>
          <div className="sidebar-utility-nav">
            <SignOutButton />
          </div>
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
                const isActive = mounted && (
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                );

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
