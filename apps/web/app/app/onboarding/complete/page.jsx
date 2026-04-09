import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Layers, Settings2 } from "lucide-react";
import { MemberOnboardingShell } from "@/components/member-onboarding-shell";
import { getProfileNoticeMessage, getProfileNoticeTone } from "@/lib/profile-notices";
import { fetchMemberProfileView } from "@/lib/member-profiles";
import { getCurrentUserContext } from "@/lib/supabase/access";

const LAUNCHPAD_ACTIONS = [
  {
    href: "/app/calendar/settings",
    icon: CalendarDays,
    title: "Connect calendar",
    description: "Link your calendar providers and tune your booking preferences.",
  },
  {
    href: "/app/calendar/availability",
    icon: Settings2,
    title: "Set availability",
    description: "Decide when PATNA members can request time with you.",
  },
  {
    href: "/app/spaces",
    icon: Layers,
    title: "Explore spaces",
    description: "Start in the working groups, cohort spaces, and member channels most relevant to you.",
  },
  {
    href: "/app/publications",
    icon: BookOpen,
    title: "Browse publications",
    description: "See the research, briefs, and outputs already shaping PATNA conversations.",
  },
];

export default async function OnboardingCompletePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/onboarding/complete");
  }

  const profileResult = await fetchMemberProfileView({ supabase, userId: user.id });

  if (profileResult.error || !profileResult.member) {
    redirect("/app/onboarding");
  }

  const member = profileResult.member;

  if (!member.isOnboardingComplete) {
    redirect("/app/onboarding");
  }

  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const noticeMessage = notice ? getProfileNoticeMessage(notice) : "";
  const noticeTone = getProfileNoticeTone(notice);
  const sectionLinks = member.sectionStatus.map((section) => ({
    ...section,
    href: section.id === "review-confirm" ? "/app/onboarding/complete" : `/app/profile?edit=1&step=${section.id}`,
  }));

  return (
    <MemberOnboardingShell
      activeSectionId="review-confirm"
      helper="You can start wherever feels most useful now. PATNA keeps your profile ready while you continue setting up the rest of your workspace."
      member={member}
      progressPercent={100}
      sectionLinks={sectionLinks}
      subtitle="Your core PATNA profile is complete. The next step is choosing how you want to begin using the workspace."
      title="Welcome into PATNA"
    >
      {noticeMessage ? (
        <p className={noticeTone === "success" ? "form-success" : "form-error"}>{noticeMessage}</p>
      ) : null}

      <section className="member-onboarding-complete-hero member-onboarding-complete-finish-card">
        <div className="member-onboarding-complete-copy">
          <span className="section-label">Profile complete</span>
          <h2>You&apos;re ready to enter the PATNA dashboard</h2>
          <p>
            Your profile is complete and collaboration-ready. Head into the member workspace now,
            then come back to the setup links below whenever you want to connect more of your PATNA tools.
          </p>
        </div>

        <div className="member-onboarding-complete-actions">
          <Link className="primary-button member-onboarding-dashboard-button" href="/app">
            <span>Go to dashboard</span>
            <ArrowRight size={16} />
          </Link>
          <Link className="secondary-button" href="/app/profile">
            Review live profile
          </Link>
        </div>
      </section>

      <section className="member-onboarding-next-steps">
        <div className="member-onboarding-next-steps-copy">
          <span className="section-label">Optional next steps</span>
          <h3>Continue setting up, whenever you&apos;re ready</h3>
          <p>
            Keep building out your workspace whenever it feels useful. Start with the PATNA area
            that best matches how you want to work next.
          </p>
        </div>

        <div className="member-launchpad-grid member-launchpad-grid-compact">
          {LAUNCHPAD_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link className="member-launchpad-card member-launchpad-card-compact" href={action.href} key={action.href}>
                <span className="member-launchpad-icon">
                  <Icon size={18} />
                </span>
                <div className="member-launchpad-card-copy">
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
                <span className="member-launchpad-link">Open</span>
              </Link>
            );
          })}
        </div>
      </section>
    </MemberOnboardingShell>
  );
}
