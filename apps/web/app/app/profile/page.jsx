import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { MemberProfileForm } from "@/components/member-profile-form";
import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import {
  formatProfileAvailabilityStatus,
  formatProfileVisibilitySetting,
} from "@/lib/profile-form-options";
import {
  getNextProfileSectionId,
  getPreviousProfileSectionId,
  normaliseProfileSectionId,
  PROFILE_SECTIONS,
} from "@/lib/profile-onboarding";
import { getProfileNoticeMessage, getProfileNoticeTone } from "@/lib/profile-notices";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberProfileView } from "@/lib/member-profiles";
import { buildSidebarUser } from "@/lib/member-workspace";
import { replaceOwnHeadshotAction, saveMemberProfileAction } from "./actions";

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

function getOnboardingHref({ notice = "", step = "" }) {
  const params = new URLSearchParams();

  if (step) {
    params.set("step", step);
  }

  if (notice) {
    params.set("notice", notice);
  }

  const query = params.toString();
  return query ? `/app/onboarding?${query}` : "/app/onboarding";
}

export default async function MemberProfilePage({ searchParams }) {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/profile");
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
      <MemberWorkspaceShell
        eyebrow="Member profile"
        title="Complete account setup"
        subtitle="PATNA could not fully load your member profile yet. This usually means your account exists in login but has not finished profile provisioning."
      >
        <article className="dashboard-card member-module-card">
          <h3>Profile provisioning still needed</h3>
          <p className="member-section-copy">
            Your login worked, but the profile record needed for the member workspace is missing or not yet available.
            Please contact a PATNA administrator to complete account setup, or try signing in again shortly if the account was just invited.
          </p>
          <div className="profile-step-links">
            <Link className="secondary-button" href="/auth/login?next=/app/profile">
              Return to sign in
            </Link>
            <Link className="primary-button" href="/contact">
              Contact PATNA
            </Link>
          </div>
        </article>
      </MemberWorkspaceShell>
    );
  }

  const member = profileResult.member;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const requestedStep = normaliseProfileSectionId(resolvedSearchParams?.step);

  if (!member.isOnboardingComplete) {
    redirect(getOnboardingHref({ notice, step: requestedStep || member.firstIncompleteSection }));
  }

  const noticeMessage = notice ? getProfileNoticeMessage(notice) : "";
  const noticeTone = getProfileNoticeTone(notice);
  const editMode = resolvedSearchParams?.edit === "1";
  const activeStepId = requestedStep || "identity-contact";
  const activeSection = PROFILE_SECTIONS.find((section) => section.id === activeStepId) || PROFILE_SECTIONS[0];
  const nextStepId = getNextProfileSectionId(activeSection.id);
  const previousStepId = getPreviousProfileSectionId(activeSection.id);
  const formConfig = getCohortOnboardingConfig(member.primaryCohort?.slug);
  const sectionLinks = member.sectionStatus.map((section) => ({
    ...section,
    href: getSectionHref(section.id, true),
  }));
  const reviewLinks = sectionLinks.filter((section) => section.id !== "review-confirm");

  if (editMode) {
    return (
      <MemberWorkspaceShell
        eyebrow="Profile"
        notificationUserId={user?.id ?? null}
        sidebarUser={buildSidebarUser(member)}
        title="Edit PATNA profile"
        subtitle="Update any section of your profile without losing the guided structure used during onboarding."
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
              <div className="section-label">Profile completion</div>
              <h3>{member.completionPercent}% complete</h3>
              <p className="muted-note">
                {member.remainingRequiredFields.length
                  ? `${member.remainingRequiredFields.length} required field${member.remainingRequiredFields.length === 1 ? "" : "s"} remaining.`
                  : "All required onboarding fields are complete."}
              </p>
            </div>
            <Link className="secondary-button" href="/app/profile">
              Back to profile view
            </Link>
          </div>
          <div className="progress-bar-track" aria-hidden="true">
            <span className="progress-bar-fill" style={{ width: `${member.completionPercent}%` }} />
          </div>
          <div className="onboarding-section-grid">
            {sectionLinks.map((section) => (
              <Link
                className={
                  section.id === activeSection.id
                    ? "onboarding-section-card active"
                    : section.isComplete
                      ? "onboarding-section-card complete"
                      : "onboarding-section-card"
                }
                href={section.href}
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

        <MemberProfileForm
          action={saveMemberProfileAction}
          cancelHref="/app/profile"
          codeOfConductDownloadHref={
            member.codeOfConductAsset?.source_kind !== "none" ? "/app/profile/code-of-conduct" : ""
          }
          cohorts={cohorts}
          cohortProfile={member.cohortProfile}
          countries={countries || []}
          currentCohorts={currentCohorts}
          currentTags={currentTags}
          flowMode="edit"
          ndaDownloadHref={member.ndaAsset?.source_kind !== "none" ? "/app/profile/nda" : ""}
          nextStepId={nextStepId}
          notice={noticeMessage}
          noticeTone={noticeTone}
          profile={member}
          remainingRequiredFields={member.remainingRequiredFields}
          resumeDownloadHref={member.resumeAsset?.source_kind !== "none" ? "/app/profile/resume" : ""}
          reviewLinks={reviewLinks}
          section={activeSection}
          submitLabel="Save section"
          tags={tags}
          title="Profile editor"
        />

        <div className="profile-step-links">
          {previousStepId ? (
            <Link className="secondary-button" href={getSectionHref(previousStepId, true)}>
              Previous section
            </Link>
          ) : null}
          {nextStepId ? (
            <Link className="secondary-button" href={getSectionHref(nextStepId, true)}>
              Next section
            </Link>
          ) : null}
        </div>
      </MemberWorkspaceShell>
    );
  }

  return (
    <MemberWorkspaceShell
      eyebrow="Member profile"
      headerActions={
        <Link className="primary-button" href="/app/profile?edit=1&step=identity-contact">
          Edit profile
        </Link>
      }
      notificationUserId={user?.id ?? null}
      sidebarUser={buildSidebarUser(member)}
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
        </div>
        <div className="progress-bar-track" aria-hidden="true">
          <span className="progress-bar-fill" style={{ width: `${member.completionPercent}%` }} />
        </div>
        <div className="onboarding-section-grid">
          {sectionLinks.map((section) => (
            <Link className={section.isComplete ? "onboarding-section-card complete" : "onboarding-section-card"} href={section.href} key={section.id}>
              <strong>{section.label}</strong>
              <p>{section.description}</p>
              <span className="status-chip">{section.isComplete ? "Complete" : `${section.completionPercent}%`}</span>
            </Link>
          ))}
        </div>
      </article>

      {noticeMessage ? <p className={noticeTone === "success" ? "form-success" : "form-error"}>{noticeMessage}</p> : null}

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

      {member.publicBookingUrl ? (
        <article className="dashboard-card member-profile-section-card">
          <h3>Public booking page</h3>
          <p className="muted-note">
            Share this scheduling page directly from your PATNA profile.
          </p>
          <div className="field-summary-card" style={{ marginTop: "1rem" }}>
            <strong>Live booking link</strong>
            <p style={{ marginTop: "0.5rem", overflowWrap: "anywhere" }}>
              <code>{member.publicBookingUrl}</code>
            </p>
            <div className="profile-header-actions" style={{ marginTop: "1rem" }}>
              <Link className="secondary-button" href={member.publicBookingUrl} target="_blank">
                Open page
              </Link>
              <Link className="primary-button" href="/app/calendar/settings">
                Manage booking page
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      <div className="card-grid member-profile-overview-grid">
        <article className="dashboard-card member-profile-hero-card">
          <div className="profile-headshot-panel">
            <div className="member-headshot-frame profile-headshot-large">
              {member.headshotSrc ? (
                <img alt={`${member.displayName} headshot`} className="member-headshot-image" src={member.headshotSrc} />
              ) : (
                <span className="member-headshot-fallback">{member.displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="member-profile-hero-copy">
              <h3>{member.displayName}</h3>
              <p>
                {[member.role_title, member.organisation_name].filter(Boolean).join(" · ") || "Role or organisation pending"}
              </p>
              <div className="member-directory-tag-row">
                <span className="status-chip chip-neutral">{renderValue(member.primaryCohort?.name)}</span>
                <span className="status-chip chip-neutral">{renderValue(member.country_of_residence)}</span>
                <span className="status-chip chip-success">{formatProfileAvailabilityStatus(member.availabilityStatus)}</span>
              </div>
            </div>
          </div>
          <form action={replaceOwnHeadshotAction} className="member-profile-photo-form">
            <div className="member-profile-photo-copy">
              <div className="section-label">Profile photo</div>
              <strong>{member.headshotSrc ? "Replace your current photo" : "Add your profile photo"}</strong>
              <p>
                Upload a JPG, PNG, or WebP image up to 5MB. Your photo appears in the community workspace,
                directory, and booking profile.
              </p>
            </div>
            <label className="member-profile-photo-field">
              <span>Choose image</span>
              <input accept="image/png,image/jpeg,image/webp" name="headshot_file" type="file" />
              <span className="field-help">Recommended: a clear headshot with a simple background.</span>
            </label>
            <div className="member-profile-photo-actions">
              <button className="primary-button" type="submit">
                {member.headshotSrc ? "Update photo" : "Upload photo"}
              </button>
              <Link className="secondary-button" href="/app/profile?edit=1&step=visibility-files">
                Open full file settings
              </Link>
            </div>
          </form>
        </article>

        <article className="dashboard-card member-profile-section-card">
          <h3>Identity and contact</h3>
          <dl className="member-definition-grid">
            <div className="member-detail-card"><dt>Email</dt><dd>{member.email}</dd></div>
            <div className="member-detail-card"><dt>Phone number</dt><dd>{renderValue(member.phone_number)}</dd></div>
            <div className="member-detail-card"><dt>WhatsApp</dt><dd>{renderValue(member.whatsapp_number)}</dd></div>
            <div className="member-detail-card"><dt>Timezone</dt><dd>{renderValue(member.timezone)}</dd></div>
          </dl>
        </article>

        <article className="dashboard-card member-profile-section-card">
          <h3>Role and location</h3>
          <dl className="member-definition-grid">
            <div className="member-detail-card"><dt>Role</dt><dd>{renderValue(member.role_title)}</dd></div>
            <div className="member-detail-card"><dt>Organisation</dt><dd>{renderValue(member.organisation_name)}</dd></div>
            <div className="member-detail-card"><dt>Country</dt><dd>{renderValue(member.country_of_residence)}</dd></div>
            <div className="member-detail-card"><dt>Professional bio</dt><dd>{renderValue(member.professional_bio)}</dd></div>
          </dl>
        </article>

        <article className="dashboard-card member-profile-section-card">
          <h3>Cohorts and expertise</h3>
          <dl className="member-definition-grid">
            <div className="member-detail-card"><dt>Primary cohort</dt><dd>{renderValue(member.primaryCohort?.name)}</dd></div>
            <div className="member-detail-card"><dt>Secondary cohorts</dt><dd>{member.secondaryCohorts.length ? member.secondaryCohorts.map((cohort) => cohort.name).join(", ") : "None recorded"}</dd></div>
            <div className="member-detail-card"><dt>Domain tags</dt><dd>{member.domainTags.length ? member.domainTags.map((tag) => tag.name).join(", ") : "None recorded"}</dd></div>
            <div className="member-detail-card"><dt>Domain knowledge</dt><dd>{renderValue(member.cohortProfile?.domain_knowledge)}</dd></div>
            <div className="member-detail-card"><dt>{formConfig.focusLabel}</dt><dd>{renderValue(member.cohortProfile?.focus_area)}</dd></div>
            <div className="member-detail-card"><dt>{formConfig.notableWorkLabel}</dt><dd>{renderValue(member.cohortProfile?.notable_work)}</dd></div>
            <div className="member-detail-card"><dt>Collaboration interest</dt><dd>{renderValue(member.cohortProfile?.opportunity_interest)}</dd></div>
            <div className="member-detail-card"><dt>Languages</dt><dd>{member.languages?.length ? member.languages.join(", ") : "Not provided"}</dd></div>
          </dl>
        </article>

        <article className="dashboard-card member-profile-section-card">
          <h3>Files and visibility</h3>
          <dl className="member-definition-grid">
            <div className="member-detail-card"><dt>Visibility</dt><dd>{formatProfileVisibilitySetting(member.visibility_setting)}</dd></div>
            <div className="member-detail-card"><dt>Profile status</dt><dd>{renderValue(member.profileStatus)}</dd></div>
            <div className="member-detail-card"><dt>Headshot source</dt><dd>{renderValue(member.headshotAsset?.source_kind)}</dd></div>
            <div className="member-detail-card"><dt>Resume</dt><dd>{member.resumeAsset?.source_kind !== "none" ? <Link href="/app/profile/resume">Open file</Link> : "Not provided"}</dd></div>
            <div className="member-detail-card"><dt>Signed NDA</dt><dd>{member.ndaAsset?.source_kind !== "none" ? <Link href="/app/profile/nda">Open file</Link> : "Not provided"}</dd></div>
            <div className="member-detail-card"><dt>Code of Conduct</dt><dd>{member.codeOfConductAsset?.source_kind !== "none" ? <Link href="/app/profile/code-of-conduct">Open file</Link> : "Not provided"}</dd></div>
            <div className="member-detail-card"><dt>Completed at</dt><dd>{formatDate(member.cohortProfile?.completed_at || member.onboarding_completed_at)}</dd></div>
            <div className="member-detail-card"><dt>Submitted at</dt><dd>{formatDate(member.cohortProfile?.source_submitted_at)}</dd></div>
          </dl>
          <div className="profile-header-actions">
            <Link className="secondary-button" href="/app/profile?edit=1&step=visibility-files">
              Manage supporting files
            </Link>
          </div>
        </article>

        <article className="dashboard-card member-profile-section-card member-profile-projects-card">
          <h3>Relevant projects and work</h3>
          {renderProjectEntries(member.relevantProjects)}
        </article>
      </div>
    </MemberWorkspaceShell>
  );
}
