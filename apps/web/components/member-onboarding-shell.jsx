import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export function MemberOnboardingShell({
  activeSectionId = "",
  children,
  helper = "",
  member,
  progressPercent = 0,
  sectionLinks = [],
  subtitle,
  title,
}) {
  return (
    <div className="member-onboarding-page">
      <div className="member-onboarding-shell">
        <aside className="member-onboarding-sidebar">
          <Link className="member-onboarding-brand" href="/app">
            <Image
              alt="PATNA Initiative"
              className="member-onboarding-brand-image"
              height={675}
              priority
              src="/brand/patna-mark.png"
              width={1200}
            />
          </Link>

          <div className="member-onboarding-sidebar-card member-onboarding-sidebar-hero">
            <span className="section-label">Guided onboarding</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {helper ? <p className="member-onboarding-helper">{helper}</p> : null}
          </div>

          <div className="member-onboarding-sidebar-card member-onboarding-profile-card">
            <div className="member-onboarding-profile-head">
              <div className="member-onboarding-avatar">
                {member?.headshotSrc ? (
                  <img alt={`${member.displayName} headshot`} src={member.headshotSrc} />
                ) : (
                  <span>{member?.displayName?.slice(0, 1)?.toUpperCase() || "P"}</span>
                )}
              </div>
              <div>
                <strong>{member?.displayName || "PATNA Member"}</strong>
                <p>{member?.primaryCohort?.name || "PATNA workspace"}</p>
              </div>
            </div>

            <div className="member-onboarding-inline-progress">
              <div>
                <span>Progress</span>
                <strong>{progressPercent}% complete</strong>
              </div>
              <div className="progress-bar-track" aria-hidden="true">
                <span className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="member-onboarding-sidebar-card member-onboarding-steps-card">
            <div className="member-onboarding-steps-heading">
              <strong>Your PATNA profile</strong>
              <p>Move through each section and return whenever you need to.</p>
            </div>

            <div className="member-onboarding-step-list">
              {sectionLinks.map((section) => {
                const className = [
                  "member-onboarding-step-card",
                  section.id === activeSectionId ? "active" : "",
                  section.isComplete ? "complete" : "",
                ].filter(Boolean).join(" ");

                return (
                  <Link className={className} href={section.href} key={section.id}>
                    <div className="member-onboarding-step-card-top">
                      <strong>{section.label}</strong>
                      {section.isComplete ? <CheckCircle2 size={16} /> : <span>{section.completionPercent}%</span>}
                    </div>
                    <p>{section.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="member-onboarding-main">
          <div className="member-onboarding-topbar">
            <Link className="member-onboarding-topbar-link" href="/app">
              <ArrowLeft size={16} />
              <span>Back to workspace</span>
            </Link>
          </div>

          <div className="member-onboarding-main-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
