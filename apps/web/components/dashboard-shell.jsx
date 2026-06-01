"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, ClipboardList, Users, Layers, CalendarCheck,
  FolderKanban, BookOpen, Wrench, Handshake, Network, Menu, X,
  ChevronDown, Sparkles, ShieldCheck, Globe, Bell, Building2, UsersRound,
  Inbox, ChevronRight,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSelector } from "@/components/language-selector";
import { SignOutButton } from "@/components/sign-out-button";
import { memberNav } from "@/lib/patna-data";
import { AdminKeyboardShortcuts } from "@/components/admin-keyboard-shortcuts";

const ADMIN_ICON_MAP = {
  LayoutDashboard, ClipboardList, Users, Layers, CalendarCheck,
  FolderKanban, BookOpen, Wrench, Handshake, Network, Sparkles, ShieldCheck,
  Globe, Bell, Building2, UsersRound, Inbox,
};

const ADMIN_NAV_KEY = {
  "/admin": "dashboard",
  "/admin/applications": "applications",
  "/admin/members": "members",
  "/admin/spaces": "spaces",
  "/admin/events": "events",
  "/admin/insights": "publications",
};

function isItemActive(pathname, href) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function DashboardShell({
  title,
  subtitle,
  children,
  navItems = memberNav,
  brandHref = "/app",
  brandLabel = "PATNA Community",
  eyebrow = "Member workspace",
  breadcrumb,
  spotlight,
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track which collapsible groups are open — seed with the group containing the active route
  const [openGroups, setOpenGroups] = useState(() => {
    const open = new Set();
    for (const group of navItems) {
      if (group.collapsible && group.items.some((item) => isItemActive(pathname, item.href))) {
        open.add(group.label);
      }
    }
    return open;
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

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
            variant="full"
          />
          <div className="dashboard-sidebar-branding">
            <strong className="dashboard-sidebar-title">{brandLabel}</strong>
            <p className="dashboard-sidebar-copy">
              {t("admin.shell.sidebarCopy")}
            </p>
          </div>
        </div>

        {spotlight ? (
          <div className="dashboard-spotlight">
            <div className="dashboard-spotlight-label">{spotlight.label || t("admin.shell.spotlightFallbackLabel")}</div>
            <strong>{spotlight.title || t("admin.shell.spotlightFallbackTitle")}</strong>
            <p>
              {spotlight.body || t("admin.shell.spotlightFallbackBody")}
            </p>
          </div>
        ) : null}

        <nav aria-label="Admin navigation">
          {navItems.map((group) => {
            const isCollapsible = group.collapsible === true;
            const isOpen = !isCollapsible || openGroups.has(group.label);

            const items = group.items.map((item) => {
              const Icon = ADMIN_ICON_MAP[item.icon];
              const isActive = mounted && isItemActive(pathname, item.href);
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
            });

            return (
              <div className="nav-group" key={group.label}>
                {isCollapsible ? (
                  <button
                    aria-expanded={isOpen}
                    className="nav-group-toggle"
                    onClick={() => toggleGroup(group.label)}
                    type="button"
                  >
                    <span>{group.labelKey ? t(group.labelKey) : group.label}</span>
                    <ChevronDown
                      className={`nav-group-chevron${isOpen ? " is-open" : ""}`}
                      size={12}
                    />
                  </button>
                ) : (
                  <div className="nav-group-label">{group.labelKey ? t(group.labelKey) : group.label}</div>
                )}

                {isCollapsible ? (
                  <div className={`nav-group-items${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
                    <div className="nav-group-items-inner">
                      {items}
                    </div>
                  </div>
                ) : (
                  items
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <LanguageSelector variant="sidebar" />
          <div className="sidebar-utility-nav">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          <section className="dashboard-overview">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav aria-label="Breadcrumb" className="dashboard-breadcrumb">
                {breadcrumb.map((crumb, i) => (
                  <span key={crumb.label} className="dashboard-breadcrumb-item">
                    {i > 0 && <ChevronRight size={11} className="dashboard-breadcrumb-sep" aria-hidden="true" />}
                    {crumb.href
                      ? <Link href={crumb.href}>{crumb.label}</Link>
                      : <span>{crumb.label}</span>
                    }
                  </span>
                ))}
              </nav>
            )}
            <div className="section-label">{eyebrow}</div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </section>
          {children}
        </div>
      </main>
      <AdminKeyboardShortcuts />
    </div>
  );
}
