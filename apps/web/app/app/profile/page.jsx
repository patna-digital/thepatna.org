import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MemberProfileForm } from "@/components/member-profile-form";
import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import {
  getNextProfileSectionId,
  getPreviousProfileSectionId,
  normaliseProfileSectionId,
  PROFILE_SECTIONS,
} from "@/lib/profile-onboarding";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberProfileView } from "@/lib/member-profiles";
import { saveMemberProfileAction } from "./actions";

function getNoticeMessage(notice) {
  if (notice === "invalid-selection") {
    return "Please choose a valid PATNA cohort and valid domain tags.";
  }

  if (notice === "save-error") {
    return "Profile progress could not be saved. Please retry.";
  }

  if (notice === "saved") {
    return "Progress saved.";
  }

  if (notice === "completed") {
    return "Your core PATNA profile is complete.";
  }

  return "";
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderValue(value) {
  return value || "Not provided";
}

function renderProjectEntries(projects) {
  if (!projects?.length) {
    return <p>Not provided</p>;
  }

  return (
    <ul className="check-list">
      {projects.map((project, index) => (
        <li key={`${project.title || "project"}-${project.link || index}`}>
          {project.link ? (
            <a href={project.link} rel="noreferrer" target="_blank">
              {project.title || project.link}
            </a>
          ) : (
            project.title || "Untitled project"
          )}
        </li>
      ))}
    </ul>
  );
}

function getSectionHref(sectionId, editMode) {
  const params = new URLSearchParams();

  if (editMode) {
    params.set("edit", "1");
  }

  if (sectionId) {
    params.set("step", sectionId);
  }

  const query = params.toString();
  return query ? `/app/profile?${query}` : "/app/profile";
}

export default async function MemberProfilePage({ searchParams }) {
  const { supabase, user } = await getCurrentUserContext();

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/profile");
  }

  const adminClient = createSupabaseAdminClient();
  const [{ data: cohorts }, { data: tags }, { data: currentCohorts }, { data: currentTags }, resolvedSearchParams, profileResult] =
    await Promise.all([
      supabase.from("cohorts").select("id, name, slug").order("name"),
      supabase.from("domain_tags").select("id, name, slug").order("name"),
      supabase
        .from("user_cohorts")
        .select("cohort_id, is_primary, cohorts!inner(name, slug)")
        .eq("user_id", user.id),
      supabase.from("user_tags").select("tag_id, domain_tags!inner(name, slug)").eq("user_id", user.id),
      searchParams,
      fetchMemberProfileView({ adminClient, supabase, userId: user.id }),
    ]);

  if (profileResult.error || !profileResult.member) {
    redirect("/app");
  }

  const member = profileResult.member;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const requestedStep = normaliseProfileSectionId(resolvedSearchParams?.step);
  const guidedMode = !member.isOnboardingComplete;
  const editMode = guidedMode || resolvedSearchParams?.edit === "1";
  const activeStepId =
    requestedStep || (guidedMode ? member.firstIncompleteSection : "identity-contact");
  const activeSection = PROFILE_SECTIONS.find((section) => section.id === activeStepId) || PROFILE_SECTIONS[0];
  const nextStepId = getNextProfileSectionId(activeSection.id);
  const previousStepId = getPreviousProfileSectionId(activeSection.id);
  const formConfig = getCohortOnboardingConfig(member.primaryCohort?.slug);

  if (editMode) {
    return (
      <DashboardShell
        title={guidedMode ? "Complete your PATNA profile" : formConfig.title}
        subtitle={
          guidedMode
            ? "Move through the guided sections below. Your progress is saved as you go, and you can always come back later."
            : "Update any section of your profile without losing the guided structure used during onboarding."
        }
      >
        <article className="dashboard-card onboarding-progress-card">
          {member.profileStatus === "inactive" ? (
            <div className="field-summary-card">
              <strong>Profile currently inactive</strong>
              <p>
                An admin has marked your profile inactive, so it is hidden from the member directory for now. You can still update everything here.
              </p>
            </div>
          ) : null}
          <div className="profile-header-actions">
            <div>
              <div className="section-label">Profile progress</div>
              <h3>{member.completionPercent}% complete</h3>
              <p className="muted-note">
                {member.remainingRequiredFields.length
                  ? `${member.remainingRequiredFields.length} required field${member.remainingRequiredFields.length === 1 ? "" : "s"} remaining.`
                  : "All required onboarding fields are complete."}
              </p>
            </div>
            {!guidedMode ? (
              <Link className="secondary-button" href="/app/profile">
                Back to profile view
              </Link>
            ) : null}
          </div>
          <div className="progress-bar-track" aria-hidden="true">
            <span className="progress-bar-fill" style={{ width: `${member.completionPercent}%` }} />
          </div>
          <div className="onboarding-section-grid">
            {member.sectionStatus.map((section) => (
              <Link
                className={
                  section.id === activeSection.id
                    ? "onboarding-section-card active"
                    : section.isComplete
                      ? "onboarding-section-card complete"
                      : "onboarding-section-card"
                }
                href={getSectionHref(section.id, !guidedMode)}
                key={section.id}
              >
                <strong>{section.label}</strong>
                <p>{section.description}</p>
                <span className="status-chip">
                  {section.isComplete ? "Complete" : `${section.completionPercent}%`}
                </span>
              </Link>
            ))}
          </div>
        </article>

        {member.remainingRequiredFields.length ? (
          <article className="dashboard-card">
            <h3>Still required for activation and collaboration</h3>
            <ul className="check-list">
              {member.remainingRequiredFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </article>
        ) : null}

        <MemberProfileForm
          action={saveMemberProfileAction}
          cancelHref={guidedMode ? "/app" : "/app/profile"}
          cohorts={cohorts}
          cohortProfile={member.cohortProfile}
          currentCohorts={currentCohorts}
          currentTags={currentTags}
          flowMode={guidedMode ? "guided" : "edit"}
          nextStepId={nextStepId}
          notice={notice ? getNoticeMessage(notice) : ""}
          noticeTone={notice === "saved" || notice === "completed" ? "success" : "error"}
          profile={member}
          remainingRequiredFields={member.remainingRequiredFields}
          resumeDownloadHref={member.resumeAsset?.source_kind !== "none" ? "/app/profile/resume" : ""}
          section={activeSection}
          submitLabel={
            guidedMode
              ? activeSection.id === "review-confirm"
                ? member.isOnboardingComplete
                  ? "Finish onboarding"
                  : "Review missing fields"
                : "Save and continue"
              : "Save section"
          }
          tags={tags}
          title={guidedMode ? "Guided onboarding" : "Profile editor"}
        />

        <div className="profile-step-links">
          {previousStepId ? (
            <Link className="secondary-button" href={getSectionHref(previousStepId, !guidedMode)}>
              Previous section
            </Link>
          ) : null}
          {nextStepId && !guidedMode ? (
            <Link className="secondary-button" href={getSectionHref(nextStepId, true)}>
              Next section
            </Link>
          ) : null}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={formConfig.title}
      subtitle="This is the PATNA profile currently stored for your account. You can review, improve, and edit it whenever needed."
    >
      <article className="dashboard-card onboarding-progress-card">
        {member.profileStatus === "inactive" ? (
          <div className="field-summary-card">
            <strong>Profile currently inactive</strong>
            <p>
              Your PATNA profile is hidden from the member directory right now, but you can still edit it and keep it up to date.
            </p>
          </div>
        ) : null}
        <div className="profile-header-actions">
          <div>
            <div className="section-label">Profile completion</div>
            <h3>{member.completionPercent}% complete</h3>
            <p className="muted-note">
              {member.remainingRequiredFields.length
                ? "Some collaboration-ready fields are still missing."
                : "Your core onboarding fields are complete."}
            </p>
          </div>
          <Link className="primary-button" href="/app/profile?edit=1&step=identity-contact">
            Edit profile
          </Link>
        </div>
        <div className="progress-bar-track" aria-hidden="true">
          <span className="progress-bar-fill" style={{ width: `${member.completionPercent}%` }} />
        </div>
        <div className="onboarding-section-grid">
          {member.sectionStatus.map((section) => (
            <Link className={section.isComplete ? "onboarding-section-card complete" : "onboarding-section-card"} href={getSectionHref(section.id, true)} key={section.id}>
              <strong>{section.label}</strong>
              <p>{section.description}</p>
              <span className="status-chip">{section.isComplete ? "Complete" : `${section.completionPercent}%`}</span>
            </Link>
          ))}
        </div>
      </article>

      {notice ? <p className="form-success">{getNoticeMessage(notice)}</p> : null}

      {!member.isOnboardingComplete ? (
        <article className="dashboard-card">
          <h3>Profile still needs a few details</h3>
          <p className="muted-note">
            You can still use the platform, but completing these required fields improves collaboration, coordination, and the way your profile is displayed.
          </p>
          <ul className="check-list">
            {member.remainingRequiredFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          <div className="profile-header-actions">
            <Link className="primary-button" href={`/app/profile?step=${member.firstIncompleteSection}`}>
              Continue onboarding
            </Link>
          </div>
        </article>
      ) : null}

      {member.needsResumeRecovery ? (
        <article className="dashboard-card">
          <h3>Resume still needs recovery</h3>
          <p className="muted-note">
            Your current resume is still linked from an external source. Uploading a fresh file from edit mode will move it into PATNA storage.
          </p>
          <div className="profile-header-actions">
            <Link className="secondary-button" href="/app/profile/resume">
              Open current resume
            </Link>
            <Link className="primary-button" href="/app/profile?edit=1&step=visibility-files">
              Upload replacement resume
            </Link>
          </div>
        </article>
      ) : null}

      <article className="dashboard-card">
        <h3>Profile summary</h3>
        <div className="member-meta-grid">
          <div>
            <strong>Email</strong>
            <p>{member.email}</p>
          </div>
          <div>
            <strong>Name</strong>
            <p>{[member.title, member.first_name, member.surname].filter(Boolean).join(" ") || "Not provided"}</p>
          </div>
          <div>
            <strong>Phone number</strong>
            <p>{renderValue(member.phone_number)}</p>
          </div>
          <div>
            <strong>WhatsApp number</strong>
            <p>{renderValue(member.whatsapp_number)}</p>
          </div>
          <div>
            <strong>Timezone</strong>
            <p>{renderValue(member.timezone)}</p>
          </div>
          <div>
            <strong>Role</strong>
            <p>{renderValue(member.role_title)}</p>
          </div>
          <div>
            <strong>Organisation</strong>
            <p>{renderValue(member.organisation_name)}</p>
          </div>
          <div>
            <strong>Country</strong>
            <p>{renderValue(member.country_of_residence)}</p>
          </div>
          <div>
            <strong>Visibility</strong>
            <p>{renderValue(member.visibility_setting?.replace("_", " "))}</p>
          </div>
          <div>
            <strong>Profile status</strong>
            <p>{renderValue(member.profileStatus)}</p>
          </div>
          <div>
            <strong>Availability</strong>
            <p>{renderValue(member.availabilityStatus)}</p>
          </div>
        </div>
      </article>

      <article className="dashboard-card">
        <h3>Headshot</h3>
        <div className="profile-headshot-panel">
          <div className="member-headshot-frame profile-headshot-large">
            {member.headshotSrc ? (
              <img alt={`${member.displayName} headshot`} className="member-headshot-image" src={member.headshotSrc} />
            ) : (
              <span className="member-headshot-fallback">{member.displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <strong>Image source</strong>
            <p>{renderValue(member.headshotAsset?.source_kind)}</p>
          </div>
        </div>
      </article>

      <article className="dashboard-card">
        <h3>Cohorts and expertise</h3>
        <div className="member-meta-grid">
          <div>
            <strong>Primary cohort</strong>
            <p>{renderValue(member.primaryCohort?.name)}</p>
          </div>
          <div>
            <strong>Secondary cohorts</strong>
            <p>{member.secondaryCohorts.length ? member.secondaryCohorts.map((cohort) => cohort.name).join(", ") : "None recorded"}</p>
          </div>
          <div>
            <strong>Domain tags</strong>
            <p>{member.domainTags.length ? member.domainTags.map((tag) => tag.name).join(", ") : "None recorded"}</p>
          </div>
          <div>
            <strong>Domain knowledge</strong>
            <p>{renderValue(member.cohortProfile?.domain_knowledge)}</p>
          </div>
          <div>
            <strong>Languages</strong>
            {member.languages?.length ? (
              <ul className="check-list compact-list">
                {member.languages.map((language) => (
                  <li key={language}>{language}</li>
                ))}
              </ul>
            ) : (
              <p>Not provided</p>
            )}
          </div>
          <div>
            <strong>{formConfig.focusLabel}</strong>
            <p>{renderValue(member.cohortProfile?.focus_area)}</p>
          </div>
          <div>
            <strong>{formConfig.notableWorkLabel}</strong>
            <p>{renderValue(member.cohortProfile?.notable_work)}</p>
          </div>
          <div>
            <strong>Collaboration interest</strong>
            <p>{renderValue(member.cohortProfile?.opportunity_interest)}</p>
          </div>
          <div>
            <strong>Professional bio</strong>
            <p>{renderValue(member.professional_bio)}</p>
          </div>
          <div>
            <strong>Relevant projects</strong>
            {renderProjectEntries(member.relevantProjects)}
          </div>
        </div>
      </article>

      <article className="dashboard-card">
        <h3>Files and completion</h3>
        <div className="member-meta-grid">
          <div>
            <strong>Headshot</strong>
            <p>{member.cohortProfile?.headshot_url ? <a href={member.cohortProfile.headshot_url} rel="noreferrer" target="_blank">Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>CV / resume</strong>
            <p>{member.resumeAsset?.source_kind !== "none" ? <a href="/app/profile/resume">Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>Resume source</strong>
            <p>{renderValue(member.resumeAsset?.source_kind)}</p>
          </div>
          <div>
            <strong>NDA</strong>
            <p>{member.cohortProfile?.nda_url ? <a href={member.cohortProfile.nda_url} rel="noreferrer" target="_blank">Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>Code of Conduct</strong>
            <p>{member.cohortProfile?.code_of_conduct_url ? <a href={member.cohortProfile.code_of_conduct_url} rel="noreferrer" target="_blank">Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>Submitted at</strong>
            <p>{formatDate(member.cohortProfile?.source_submitted_at)}</p>
          </div>
          <div>
            <strong>Completed at</strong>
            <p>{formatDate(member.cohortProfile?.completed_at || member.onboarding_completed_at)}</p>
          </div>
        </div>
      </article>
    </DashboardShell>
  );
}
