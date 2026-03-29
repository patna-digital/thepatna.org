"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { memberNav } from "@/lib/patna-data";

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
  children,
  navItems = memberNav,
}) {
  const pathname = usePathname();

  return (
    <div className="member-workspace-shell">
      <aside className="member-workspace-sidebar">
        <div className="member-workspace-brand">
          <BrandLogo
            href="/app"
            label="PATNA Initiative"
            showCopy={false}
            theme="sidebar"
            variant="mark"
          />
          <div>
            <strong>PATNA</strong>
            <span>Initiative</span>
          </div>
        </div>

        {sidebarUser ? (
          <div className={`member-sidebar-user tone-${getProfileTone(sidebarUser)}`}>
            <div className="member-sidebar-user-kicker">Member workspace</div>
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
            <div className="member-sidebar-user-meta">
              <span>{sidebarUser.cohort}</span>
            </div>
            <div className="member-sidebar-user-organisation">
              <span>{sidebarUser.organisation}</span>
            </div>
            {sidebarUser.tags?.length ? (
              <div className="member-sidebar-user-tags">
                {sidebarUser.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <nav aria-label="Member navigation" className="member-workspace-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === "/app" ? pathname === item.href : pathname.startsWith(item.href);

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

        <div className="member-workspace-footer-note">Members only workspace</div>
      </aside>

      <main className="member-workspace-main">
        <div className="member-workspace-main-inner">
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
