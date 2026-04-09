import Link from "next/link";
import {
  MemberProfileReviewSummary,
  MemberProfileSectionFields,
} from "@/components/member-profile-fields";

export function MemberProfileForm({
  action,
  cancelHref,
  codeOfConductDownloadHref = "",
  cohorts,
  cohortProfile,
  currentCohorts,
  currentTags,
  flowMode = "edit",
  ndaDownloadHref = "",
  nextStepId = "",
  notice,
  noticeTone = "error",
  profile,
  remainingRequiredFields = [],
  resumeDownloadHref,
  reviewLinks = [],
  section,
  submitLabel,
  tags,
  title = "Cohort onboarding profile",
}) {
  const isGuided = flowMode === "guided";
  const isReviewStep = section?.id === "review-confirm";

  return (
    <form action={action} className={`form-card guided-profile-form${isGuided ? " guided-profile-form-onboarding" : ""}`}>
      <input name="section_id" type="hidden" value={section?.id || ""} />
      <input name="flow_mode" type="hidden" value={flowMode} />
      <input name="next_step_id" type="hidden" value={nextStepId} />

      <div className="guided-form-header">
        <div>
          <div className="section-label">{title}</div>
          <h3>{section?.label || title}</h3>
          <p>{section?.description || "Update your PATNA profile details."}</p>
        </div>
      </div>

      {notice ? <p className={noticeTone === "success" ? "form-success" : "form-error"}>{notice}</p> : null}

      {isReviewStep ? (
        <MemberProfileReviewSummary
          remainingRequiredFields={remainingRequiredFields}
          reviewLinks={reviewLinks}
        />
      ) : (
        <MemberProfileSectionFields
          codeOfConductDownloadHref={codeOfConductDownloadHref}
          cohortProfile={cohortProfile}
          cohorts={cohorts}
          currentCohorts={currentCohorts}
          currentTags={currentTags}
          ndaDownloadHref={ndaDownloadHref}
          profile={profile}
          resumeDownloadHref={resumeDownloadHref}
          sectionId={section?.id}
          tags={tags}
        />
      )}

      <div className="form-action-row guided-form-actions">
        {cancelHref ? (
          <Link className="secondary-button" href={cancelHref}>
            {isGuided ? "Back to app" : "Cancel"}
          </Link>
        ) : null}
        <div className="guided-form-submit-group">
          {isGuided ? (
            <>
              <button className="secondary-button" name="intent" type="submit" value="save">
                Save progress
              </button>
              <button
                className="primary-button"
                name="intent"
                type="submit"
                value={isReviewStep ? "finish" : "continue"}
              >
                {submitLabel}
              </button>
            </>
          ) : (
            <button className="primary-button" name="intent" type="submit" value="save">
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
