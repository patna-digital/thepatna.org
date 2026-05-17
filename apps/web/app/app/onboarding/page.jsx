import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberOnboardingShell } from "@/components/member-onboarding-shell";
import { MemberProfileForm } from "@/components/member-profile-form";
import {
  getNextProfileSectionId,
  getPreviousProfileSectionId,
  normaliseProfileSectionId,
  PROFILE_SECTIONS,
} from "@/lib/profile-onboarding";
import { getProfileNoticeMessage, getProfileNoticeTone } from "@/lib/profile-notices";
import { fetchMemberProfileView } from "@/lib/member-profiles";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { saveOnboardingProfileAction } from "./actions";

function getOnboardingStepHref(sectionId) {
  const params = new URLSearchParams();

  if (sectionId) {
    params.set("step", sectionId);
  }

  const query = params.toString();
  return query ? `/app/onboarding?${query}` : "/app/onboarding";
}

export default async function OnboardingPage({ searchParams }) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/onboarding");
  }

  const [{ data: cohorts }, { data: tags }, { data: currentCohorts }, { data: currentTags }, { data: countries }, resolvedSearchParams, profileResult] =
    await Promise.all([
      supabase.from("cohorts").select("id, name, slug").order("name"),
      supabase.from("domain_tags").select("id, name, slug").order("name"),
      supabase
        .from("user_cohorts")
        .select("cohort_id, is_primary, cohorts!inner(name, slug)")
        .eq("user_id", user.id),
      supabase.from("user_tags").select("tag_id, domain_tags!inner(name, slug)").eq("user_id", user.id),
      supabase.from("countries").select("code, name").eq("is_active", true).order("name"),
      searchParams,
      fetchMemberProfileView({ supabase, userId: user.id }),
    ]);

  if (profileResult.error || !profileResult.member) {
    return (
      <MemberOnboardingShell
        helper="Please contact PATNA if your account was just invited and the provisioning record has not appeared yet."
        member={null}
        progressPercent={0}
        sectionLinks={[]}
        subtitle="Your login worked, but PATNA could not yet load the profile record needed for guided onboarding."
        title="Complete account setup"
      >
        <article className="dashboard-card member-module-card">
          <h3>Profile provisioning still needed</h3>
          <p className="member-section-copy">
            Your account exists in authentication, but the PATNA member profile record is not ready yet.
            Please contact an administrator or try signing in again shortly if the invite was just sent.
          </p>
          <div className="profile-step-links">
            <Link className="secondary-button" href="/auth/login?next=/app/onboarding">
              Return to sign in
            </Link>
            <Link className="primary-button" href="/contact">
              Contact PATNA
            </Link>
          </div>
        </article>
      </MemberOnboardingShell>
    );
  }

  const member = profileResult.member;

  if (member.isOnboardingComplete) {
    redirect("/app/profile");
  }

  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const noticeMessage = notice ? getProfileNoticeMessage(notice) : "";
  const noticeTone = getProfileNoticeTone(notice);
  const requestedStep = normaliseProfileSectionId(resolvedSearchParams?.step);
  const activeStepId = requestedStep || member.firstIncompleteSection;
  const activeSection = PROFILE_SECTIONS.find((section) => section.id === activeStepId) || PROFILE_SECTIONS[0];
  const nextStepId = getNextProfileSectionId(activeSection.id);
  const previousStepId = getPreviousProfileSectionId(activeSection.id);
  const sectionLinks = member.sectionStatus.map((section) => ({
    ...section,
    href: getOnboardingStepHref(section.id),
  }));
  const reviewLinks = sectionLinks.filter((section) => section.id !== "review-confirm");

  return (
    <MemberOnboardingShell
      activeSectionId={activeSection.id}
      helper="Your progress saves as you go. Once your profile is complete, you can head straight into the dashboard and continue setup from whichever PATNA tools matter most."
      member={member}
      progressPercent={member.completionPercent}
      sectionLinks={sectionLinks}
      subtitle="Create a collaboration-ready PATNA profile with a clear sense of who you are, what you focus on, and how members can work with you."
      title="Build your PATNA presence"
    >
      {member.profileStatus === "inactive" ? (
        <div className="field-summary-card member-onboarding-inline-alert">
          <strong>Profile currently inactive</strong>
          <p>
            An administrator has hidden your profile from the directory for now, but you can still complete onboarding and keep everything ready.
          </p>
        </div>
      ) : null}

      <MemberProfileForm
        action={saveOnboardingProfileAction}
        cancelHref="/app"
        codeOfConductDownloadHref={
          member.codeOfConductAsset?.source_kind !== "none" ? "/app/profile/code-of-conduct" : ""
        }
        cohorts={cohorts}
        cohortProfile={member.cohortProfile}
        countries={countries || []}
        currentCohorts={currentCohorts}
        currentTags={currentTags}
        flowMode="guided"
        ndaDownloadHref={member.ndaAsset?.source_kind !== "none" ? "/app/profile/nda" : ""}
        nextStepId={nextStepId}
        notice={noticeMessage}
        noticeTone={noticeTone}
        profile={member}
        remainingRequiredFields={member.remainingRequiredFields}
        resumeDownloadHref={member.resumeAsset?.source_kind !== "none" ? "/app/profile/resume" : ""}
        reviewLinks={reviewLinks}
        section={activeSection}
        submitLabel={
          activeSection.id === "review-confirm"
            ? member.isOnboardingComplete
              ? "Finish onboarding"
              : "Review missing fields"
            : "Save and continue"
        }
        tags={tags}
        title="PATNA onboarding"
      />

      <div className="member-onboarding-footer-nav">
        {previousStepId ? (
          <Link className="secondary-button" href={getOnboardingStepHref(previousStepId)}>
            Previous section
          </Link>
        ) : (
          <span />
        )}
        {nextStepId && activeSection.id !== "review-confirm" ? (
          <Link className="secondary-button" href={getOnboardingStepHref(nextStepId)}>
            Skip ahead
          </Link>
        ) : null}
      </div>
    </MemberOnboardingShell>
  );
}
