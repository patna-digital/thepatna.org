"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Layers, Users, CalendarCheck, BookOpen, CalendarDays, Settings, Menu, X,
} from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { SignOutButton } from "@/components/sign-out-button";
import { NotificationBell } from "@/components/notification-bell";
import { memberNav } from "@/lib/patna-data";

const MEMBER_ICON_MAP = {
  LayoutDashboard, Layers, Users, CalendarCheck, BookOpen, CalendarDays, Settings,
};

const MEMBER_NAV_KEY = {
  "/app": "dashboard",
  "/app/spaces": "spaces",
  "/app/members": "members",
  "/app/events": "events",
  "/app/publications": "publications",
  "/app/calendar": "calendar",
  "/app/settings": "settings",
  "/app/applications": "applications",
  "/app/insights": "insights",
};

function getProfileTone(member) {
  if (!member?.profileStatus || member.profileStatus === "active") {
    return "active";
  }
  return "muted";
}

export function MemberWorkspaceShell({
  title,
  subtitle,
  eyebrow = "PATNA Community",
  dateLabel = "",
  headerActions = null,
  sidebarUser = null,
  rightRail = null,
  notificationUserId = null,
  children,
  navItems = memberNav,
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const settingsItem = navItems.find((item) => item.href === "/app/settings") || null;
  const primaryNavItems = settingsItem
    ? navItems.filter((item) => item.href !== settingsItem.href)
    : navItems;
  const isSettingsActive = Boolean(
    settingsItem && pathname.startsWith(settingsItem.href),
  );

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

  const shellClass = [
    "member-workspace-shell",
    rightRail ? "shell-with-rail" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={shellClass}>
      <div className="mob-topbar mob-topbar--member">
        <span className="mob-topbar-brand">PATNA Community</span>
        <div className="mob-topbar-controls">
          <LanguageSelector variant="compact" />
          {notificationUserId && (
            <NotificationBell userId={notificationUserId} />
          )}
          <button
            aria-controls="member-sidebar"
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

      <aside className={`member-workspace-sidebar${sidebarOpen ? " mob-open" : ""}`} id="member-sidebar">
        <button
          aria-label="Close navigation menu"
          className="mob-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          type="button"
        >
          <X size={18} />
        </button>

        <div className="member-workspace-brand">
          <Link aria-label="PATNA Initiative" className="member-workspace-brand-logo" href="/app">
            <Image
              alt="PATNA Initiative"
              className="member-workspace-brand-logo-image"
              height={675}
              priority
              src="/brand/patna-mark.png"
              width={1200}
            />
          </Link>
        </div>

        {sidebarUser ? (
          <div className={`member-sidebar-user tone-${getProfileTone(sidebarUser)}`}>
            <div className="member-sidebar-user-head">
              <div className="member-sidebar-avatar">
                {sidebarUser.headshotSrc ? (
                  <img alt={`${sidebarUser.name} headshot`} src={sidebarUser.headshotSrc} />
                ) : (
                  <span>{sidebarUser.initials}</span>
                )}
              </div>
              <div className="member-sidebar-user-copy">
                <strong>{sidebarUser.name}</strong>
                <p>{sidebarUser.role}</p>
              </div>
            </div>
          </div>
        ) : null}

        <nav aria-label="Member navigation" className="member-workspace-nav">
          {primaryNavItems.map((item) => {
            const Icon = MEMBER_ICON_MAP[item.icon];
            const isActive = item.href === "/app" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                className={isActive ? "active" : ""}
                href={item.href}
                key={item.href}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-item-label">
                  <span className="nav-item-icon">{Icon && <Icon size={15} />}</span>
                  <span>{MEMBER_NAV_KEY[item.href] ? t(`member.${MEMBER_NAV_KEY[item.href]}`) : item.label}</span>
                </span>
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <LanguageSelector variant="sidebar" />
          <div className="sidebar-cross-nav">
            <div className="sidebar-cross-nav-label">{t("nav_cross.navigateTo")}</div>
            <Link className="sidebar-cross-nav-link" href="/" onClick={() => setSidebarOpen(false)}>
              <span>{t("nav_cross.website")}</span>
              <span className="sidebar-cross-nav-arrow">↗</span>
            </Link>
            <Link className="sidebar-cross-nav-link" href="/admin" onClick={() => setSidebarOpen(false)}>
              <span>{t("nav_cross.adminApp")}</span>
              <span className="sidebar-cross-nav-arrow">↗</span>
            </Link>
          </div>
          <div className="sidebar-utility-nav">
            {notificationUserId && (
              <div className="sidebar-notification-bell">
                <NotificationBell userId={notificationUserId} />
              </div>
            )}
            {settingsItem ? (
              <Link
                className={`sidebar-utility-link${isSettingsActive ? " active" : ""}`}
                href={settingsItem.href}
                onClick={() => setSidebarOpen(false)}
              >
                {t("member.settings")}
              </Link>
            ) : null}
            <SignOutButton />
          </div>
          <div className="sidebar-legal-links">
            <Link href="/legal/privacy" onClick={() => setSidebarOpen(false)}>{t("footer.privacy")}</Link>
            <span aria-hidden="true">·</span>
            <Link href="/legal/terms" onClick={() => setSidebarOpen(false)}>{t("footer.terms")}</Link>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="member-workspace-main">
        <div className="member-workspace-main-inner">
          {notificationUserId && (
            <div className="member-page-top-bell" aria-label="Notification controls">
              <NotificationBell userId={notificationUserId} />
            </div>
          )}
          <header className="member-workspace-header">
            <div className="member-workspace-header-copy">
              {dateLabel ? <div className="member-workspace-date">{dateLabel}</div> : null}
              <div className="member-workspace-eyebrow">{eyebrow}</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {headerActions ? (
              <div className="member-workspace-header-actions">
                <div className="member-workspace-header-actions-inner">{headerActions}</div>
              </div>
            ) : null}
          </header>

          {rightRail ? (
            <div className="member-workspace-page-grid">
              <div className="member-workspace-main-column">{children}</div>
              <aside className="member-workspace-right-rail">{rightRail}</aside>
            </div>
          ) : (
            <div className="member-workspace-main-column">{children}</div>
          )}
        </div>
      </main>
    </div>
  );
}
