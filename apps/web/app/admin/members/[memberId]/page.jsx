import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import { adminNav } from "@/lib/patna-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";
import { fetchMemberProfileView } from "@/lib/member-profiles";
import {
  replaceMemberHeadshotAction,
  replaceMemberResumeAction,
  updateMemberProfileStatusAction,
  updateMemberRoleAction,
} from "./actions";

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

function getNoticeMessage(notice) {
  if (notice === "headshot-updated") {
    return {
      tone: "success",
      text: "Headshot updated and stored in Supabase.",
    };
  }

  if (notice === "headshot-missing-file") {
    return {
      tone: "error",
      text: "Choose an image file before saving.",
    };
  }

  if (notice === "headshot-file-too-large") {
    return {
      tone: "error",
      text: "That image is too large for storage. Please upload a smaller JPG, PNG, or WebP file.",
    };
  }

  if (notice === "headshot-error") {
    return {
      tone: "error",
      text: "Headshot recovery failed. Please retry with a different file.",
    };
  }

  if (notice === "resume-updated") {
    return {
      tone: "success",
      text: "Resume updated and stored in Supabase.",
    };
  }

  if (notice === "resume-missing-file") {
    return {
      tone: "error",
      text: "Choose a CV/resume file before saving.",
    };
  }

  if (notice === "resume-file-too-large") {
    return {
      tone: "error",
      text: "That resume file is too large for storage. Please upload a smaller PDF, DOC, or DOCX file.",
    };
  }

  if (notice === "resume-error") {
    return {
      tone: "error",
      text: "Resume recovery failed. Please retry with a different file.",
    };
  }

  if (notice === "profile-status-updated") {
    return {
      tone: "success",
      text: "Profile status updated.",
    };
  }

  if (notice === "profile-status-error") {
    return {
      tone: "error",
      text: "Profile status could not be updated. Please retry.",
    };
  }

  if (notice === "role-granted") {
    return {
      tone: "success",
      text: "Role granted successfully.",
    };
  }

  if (notice === "role-revoked") {
    return {
      tone: "success",
      text: "Role revoked successfully.",
    };
  }

  if (notice === "role-error") {
    return {
      tone: "error",
      text: "Role could not be updated. Please retry.",
    };
  }

  return null;
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

export default async function AdminMemberDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();
  const { memberId } = await params;
  const resolvedSearchParams = await searchParams;
  const notice = getNoticeMessage(
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "",
  );
  const { error, member } = await fetchMemberProfileView({
    adminClient,
    includeAuthUser: true,
    includeInviteHistory: true,
    supabase,
    userId: memberId,
  });

  if (error || !member) {
    notFound();
  }

  const formConfig = getCohortOnboardingConfig(member.primaryCohort?.slug);

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Member detail",
        title: "Imported cohort profile",
        body: "Review the full cohort-profile record, login state, and imported supporting files for this member.",
      }}
      title={`${member.first_name || "Member"} ${member.surname || ""}`.trim()}
      subtitle="This page shows the full PATNA member profile as imported and subsequently updated by the member."
    >
      <div className="profile-header-actions">
        <Link className="secondary-button" href="/admin/members">
          Back to member queue
        </Link>
        <form action={updateMemberProfileStatusAction}>
          <input name="member_id" type="hidden" value={member.id} />
          <input name="next_status" type="hidden" value={member.profileStatus === "inactive" ? "active" : "inactive"} />
          <button className="primary-button" type="submit">
            Mark profile {member.profileStatus === "inactive" ? "active" : "inactive"}
          </button>
        </form>
      </div>

      {notice ? (
        <div className={`admin-notice ${notice.tone === "success" ? "notice-success" : "notice-error"}`}>
          {notice.text}
        </div>
      ) : null}

      <article className="dashboard-card">
        <div className="admin-card-heading">
          <h3>Access and contact state</h3>
        </div>
        <div className="member-meta-grid">
          <div>
            <strong>Email</strong>
            <p>{member.email}</p>
          </div>
          <div>
            <strong>Onboarding status</strong>
            <p>{renderValue(member.onboarding_status?.replace("_", " "))}</p>
          </div>
          <div>
            <strong>Profile status</strong>
            <p>{renderValue(member.profileStatus)}</p>
          </div>
          <div>
            <strong>Availability</strong>
            <p>{renderValue(member.availabilityStatus)}</p>
          </div>
          <div>
            <strong>Latest login email</strong>
            <p>{formatDate(member.latestInvite?.created_at || member.invited_at)}</p>
          </div>
          <div>
            <strong>Invite method</strong>
            <p>{renderValue(member.latestInvite?.delivery_method?.replace("_", " "))}</p>
          </div>
          <div>
            <strong>Last sign-in</strong>
            <p>{formatDate(member.authUser?.last_sign_in_at)}</p>
          </div>
          <div>
            <strong>Migration batch</strong>
            <p>{renderValue(member.migration_batch_id)}</p>
          </div>
          <div>
            <strong>Profile completeness</strong>
            <p>{member.isProfileComplete ? `Complete (${member.completionPercent}%)` : `Incomplete (${member.completionPercent}%)`}</p>
          </div>
        </div>
        {!member.isProfileComplete ? (
          <ul className="check-list">
            {member.missingProfileFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : null}
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading">
          <h3>Roles and permissions</h3>
        </div>
        <p className="muted-note">Grant or revoke platform roles for this member. Changes take effect immediately.</p>
        <div className="member-meta-grid" style={{ marginTop: "1rem" }}>
          {[
            { role: "member", label: "Member access", description: "Grants access to the member directory and platform features." },
            { role: "administrator", label: "Administrator access", description: "Grants full admin access including the admin workspace." },
          ].map(({ role, label, description }) => {
            const hasRole = (member.roles || []).includes(role);
            return (
              <div key={role}>
                <strong>{label}</strong>
                <p style={{ marginBottom: "0.65rem" }}>
                  <span className={`status-chip ${hasRole ? "chip-success" : "chip-muted"}`} style={{ marginRight: "0.5rem" }}>
                    {hasRole ? "Granted" : "Not granted"}
                  </span>
                  {description}
                </p>
                <form action={updateMemberRoleAction}>
                  <input name="member_id" type="hidden" value={member.id} />
                  <input name="role" type="hidden" value={role} />
                  <input name="action" type="hidden" value={hasRole ? "revoke" : "grant"} />
                  <button className="secondary-button" type="submit">
                    {hasRole ? `Revoke ${label}` : `Grant ${label}`}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Profile summary</h3></div>
        <div className="member-meta-grid">
          <div>
            <strong>Name</strong>
            <p>{[member.title, member.first_name, member.surname].filter(Boolean).join(" ") || "Not provided"}</p>
          </div>
          <div>
            <strong>Role</strong>
            <p>{renderValue(member.role_title)}</p>
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
            <strong>Professional bio</strong>
            <p>{renderValue(member.professional_bio)}</p>
          </div>
        </div>
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Cohorts and expertise</h3></div>
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
        </div>
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Cohort profile answers</h3></div>
        <div className="member-meta-grid">
          <div>
            <strong>Middle name(s)</strong>
            <p>{renderValue(member.cohortProfile?.middle_names)}</p>
          </div>
          <div>
            <strong>Gender</strong>
            <p>{renderValue(member.cohortProfile?.gender)}</p>
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
            <strong>Domain knowledge / areas of competence</strong>
            <p>{renderValue(member.cohortProfile?.domain_knowledge)}</p>
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
            <strong>Collaboration, mentorship, or review interest</strong>
            <p>{renderValue(member.cohortProfile?.opportunity_interest)}</p>
          </div>
          <div>
            <strong>Relevant projects</strong>
            {renderProjectEntries(member.relevantProjects)}
          </div>
          <div>
            <strong>Additional comments</strong>
            <p>{renderValue(member.cohortProfile?.additional_comments)}</p>
          </div>
        </div>
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Files and timestamps</h3></div>
        <div className="member-meta-grid">
          <div>
            <strong>Headshot preview</strong>
            <div className="profile-headshot-panel">
              <div className="member-headshot-frame profile-headshot-large">
                {member.headshotSrc ? (
                  <img alt={`${member.displayName} headshot`} className="member-headshot-image" src={member.headshotSrc} />
                ) : (
                  <span className="member-headshot-fallback">{member.displayName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <strong>Headshot</strong>
            <p>{member.cohortProfile?.headshot_url ? <a href={member.cohortProfile.headshot_url} rel="noreferrer" target="_blank">Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>Headshot source</strong>
            <p>{renderValue(member.headshotAsset?.source_kind)}</p>
          </div>
          <div>
            <strong>Original headshot source</strong>
            <p>
              {member.headshotAsset?.original_url ? (
                <a href={member.headshotAsset.original_url} rel="noreferrer" target="_blank">
                  Open original source
                </a>
              ) : (
                "Not recorded"
              )}
            </p>
          </div>
          <div>
            <strong>CV / resume</strong>
            <p>{member.resumeAsset?.source_kind !== "none" ? <a href={`/admin/members/${member.id}/resume`}>Open file</a> : "Not provided"}</p>
          </div>
          <div>
            <strong>Resume source</strong>
            <p>{renderValue(member.resumeAsset?.source_kind)}</p>
          </div>
          <div>
            <strong>Original resume source</strong>
            <p>
              {member.resumeAsset?.original_url ? (
                <a href={member.resumeAsset.original_url} rel="noreferrer" target="_blank">
                  Open original source
                </a>
              ) : (
                "Not recorded"
              )}
            </p>
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

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Headshot recovery</h3></div>
        <p className="muted-note">
          {member.needsHeadshotRecovery
            ? "This member is still using an external headshot source. Upload a replacement here to move it into PATNA storage and stabilize the directory."
            : "Use this form any time you want to replace the stored headshot from the admin portal."}
        </p>
        <form action={replaceMemberHeadshotAction} className="form-card admin-headshot-recovery-form">
          <input name="member_id" type="hidden" value={member.id} />
          <label>
            Replacement headshot
            <input accept="image/png,image/jpeg,image/webp" name="headshot_file" type="file" />
            <span className="field-help">Use a reasonably compressed JPG, PNG, or WebP file.</span>
          </label>
          <div className="form-action-row">
            <button className="primary-button" type="submit">
              {member.needsHeadshotRecovery ? "Recover headshot" : "Replace headshot"}
            </button>
          </div>
        </form>
      </article>

      <article className="dashboard-card">
        <div className="admin-card-heading"><h3>Resume recovery</h3></div>
        <p className="muted-note">
          {member.needsResumeRecovery
            ? "This member is still using an external resume link. Upload a replacement here to move it into PATNA storage and keep access private."
            : "Use this form any time you want to replace the stored resume from the admin portal."}
        </p>
        <form action={replaceMemberResumeAction} className="form-card admin-headshot-recovery-form">
          <input name="member_id" type="hidden" value={member.id} />
          <label>
            Replacement CV / resume
            <input accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" name="cv_file" type="file" />
            <span className="field-help">Use a PDF, DOC, or DOCX file up to 100MB.</span>
          </label>
          <div className="form-action-row">
            <button className="primary-button" type="submit">
              {member.needsResumeRecovery ? "Recover resume" : "Replace resume"}
            </button>
          </div>
        </form>
      </article>
    </DashboardShell>
  );
}
