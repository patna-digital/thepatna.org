import Link from "next/link";
import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import { splitLanguages, STANDARD_LANGUAGE_OPTIONS } from "@/lib/profile-structured-fields";
import { RelevantProjectsFields } from "@/components/relevant-projects-fields";

function renderSectionFields({
  cohorts,
  cohortProfile,
  currentCohorts,
  currentTags,
  profile,
  resumeDownloadHref,
  sectionId,
  tags,
}) {
  const primaryCohort = currentCohorts?.find((item) => item.is_primary)?.cohorts;
  const primaryCohortSlug = primaryCohort?.slug || "";
  const selectedTagSlugs =
    currentTags?.map((item) => item.domain_tags?.slug).filter(Boolean) ?? [];
  const { otherText: otherLanguages, selected: selectedLanguages } = splitLanguages(
    cohortProfile?.languages || [],
  );
  const formConfig = getCohortOnboardingConfig(primaryCohortSlug);

  if (sectionId === "identity-contact") {
    return (
      <>
        <label>
          Email
          <input defaultValue={profile?.email || ""} readOnly />
        </label>
        <div className="two-column-grid">
          <label>
            Title
            <input defaultValue={profile?.title || ""} name="title" placeholder="Dr." />
          </label>
          <label>
            Middle name(s)
            <input defaultValue={cohortProfile?.middle_names || ""} name="middle_names" placeholder="Middle name(s)" />
          </label>
          <label>
            First name
            <input defaultValue={profile?.first_name || ""} name="first_name" placeholder="First name" />
          </label>
          <label>
            Surname
            <input defaultValue={profile?.surname || ""} name="surname" placeholder="Surname" />
          </label>
        </div>
        <div className="two-column-grid">
          <label>
            Phone number
            <input defaultValue={profile?.phone_number || ""} name="phone_number" placeholder="+234..." />
          </label>
          <label>
            WhatsApp number
            <input defaultValue={profile?.whatsapp_number || ""} name="whatsapp_number" placeholder="+234..." />
          </label>
          <label>
            Timezone
            <input defaultValue={profile?.timezone || ""} name="timezone" placeholder="Africa/Lagos" />
          </label>
          <label>
            Gender
            <input defaultValue={cohortProfile?.gender || ""} name="gender" placeholder="Gender" />
          </label>
        </div>
        <fieldset className="checkbox-group">
          <legend>Languages</legend>
          <div className="checkbox-grid">
            {STANDARD_LANGUAGE_OPTIONS.map((language) => (
              <label className="checkbox-item" key={language}>
                <input
                  defaultChecked={selectedLanguages.includes(language)}
                  name="languages"
                  type="checkbox"
                  value={language}
                />
                <span>{language}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Other languages
          <input
            defaultValue={otherLanguages}
            name="other_languages"
            placeholder="Add any other languages, separated by commas"
          />
        </label>
      </>
    );
  }

  if (sectionId === "organisation-cohort") {
    return (
      <>
        <div className="two-column-grid">
          <label>
            Role title
            <input defaultValue={profile?.role_title || ""} name="role_title" placeholder="Policy Adviser" />
          </label>
          <label>
            Organisation
            <input
              defaultValue={profile?.organisation_name || ""}
              name="organisation_name"
              placeholder="Organisation or institution"
            />
          </label>
          <label>
            Country of residence
            <input
              defaultValue={profile?.country_of_residence || ""}
              name="country_of_residence"
              placeholder="Senegal"
            />
          </label>
          <label>
            Primary cohort
            <select defaultValue={primaryCohortSlug} name="primary_cohort_slug">
              <option value="">Select a cohort</option>
              {cohorts?.map((cohort) => (
                <option key={cohort.id} value={cohort.slug}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="checkbox-group">
          <legend>Domain tags</legend>
          <div className="checkbox-grid">
            {tags?.map((tag) => (
              <label className="checkbox-item" key={tag.id}>
                <input
                  defaultChecked={selectedTagSlugs.includes(tag.slug)}
                  name="domain_tag_slugs"
                  type="checkbox"
                  value={tag.slug}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </>
    );
  }

  if (sectionId === "expertise-collaboration") {
    return (
      <>
        <label>
          Professional bio
          <textarea
            defaultValue={profile?.professional_bio || ""}
            name="professional_bio"
            placeholder="Short professional biography"
          />
        </label>
        <label>
          Domain knowledge / areas of competence
          <textarea
            defaultValue={cohortProfile?.domain_knowledge || ""}
            name="domain_knowledge"
            placeholder="Describe your key areas of competence."
          />
        </label>
        <label>
          {formConfig.focusLabel}
          <textarea
            defaultValue={cohortProfile?.focus_area || ""}
            name="focus_area"
            placeholder={formConfig.focusPlaceholder}
          />
        </label>
        <label>
          {formConfig.notableWorkLabel}
          <textarea
            defaultValue={cohortProfile?.notable_work || ""}
            name="notable_work"
            placeholder={formConfig.notableWorkPlaceholder}
          />
        </label>
        <div className="stack">
          <div>
            <strong>Relevant projects</strong>
            <p className="field-help">Add each project separately with its title and a link.</p>
          </div>
          <RelevantProjectsFields initialProjects={cohortProfile?.relevant_projects || []} />
        </div>
        <label>
          Collaboration, mentorship, or review interest
          <input
            defaultValue={cohortProfile?.opportunity_interest || ""}
            name="opportunity_interest"
            placeholder="Yes / No / Short note"
          />
        </label>
        <label>
          Additional comments
          <textarea
            defaultValue={cohortProfile?.additional_comments || ""}
            name="additional_comments"
            placeholder="Anything else PATNA should know."
          />
        </label>
      </>
    );
  }

  if (sectionId === "visibility-files") {
    return (
      <>
        <div className="two-column-grid">
          <label>
            Visibility
            <select defaultValue={profile?.visibility_setting || "members_only"} name="visibility_setting">
              <option value="members_only">Members only</option>
              <option value="limited">Limited</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label>
            Collaboration availability
            <select defaultValue={profile?.availability_status || "available"} name="availability_status">
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
        </div>
        <div className="two-column-grid">
          <div className="field-summary-card">
            <strong>Supporting files</strong>
            <p>Upload a headshot and resume for stronger collaboration and profile display. NDA and Code of Conduct remain link-based for now.</p>
          </div>
        </div>
        <div className="two-column-grid">
          <label>
            Headshot upload
            <input name="current_headshot_url" type="hidden" value={cohortProfile?.headshot_url || ""} />
            {cohortProfile?.headshot_url ? (
              <span className="form-image-preview">
                <img alt="Current headshot" className="form-image-preview-media" src={cohortProfile.headshot_url} />
              </span>
            ) : null}
            <input accept="image/png,image/jpeg,image/webp" name="headshot_file" type="file" />
            <span className="field-help">Leave blank to keep the current headshot.</span>
          </label>
          <label>
            CV or resume upload
            <input name="current_cv_url" type="hidden" value={cohortProfile?.cv_url || ""} />
            {resumeDownloadHref ? (
              <span className="field-help">
                <a href={resumeDownloadHref}>Open current resume</a>
              </span>
            ) : cohortProfile?.cv_url ? (
              <span className="field-help">A resume is already on file.</span>
            ) : null}
            <input accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" name="cv_file" type="file" />
            <span className="field-help">Leave blank to keep the current resume. PDF, DOC, or DOCX up to 100MB.</span>
          </label>
        </div>
        <div className="two-column-grid">
          <label>
            NDA file link
            <input
              defaultValue={cohortProfile?.nda_url || ""}
              name="nda_url"
              placeholder="Existing Google Drive or hosted file link"
            />
          </label>
          <label>
            Code of Conduct link
            <input
              defaultValue={cohortProfile?.code_of_conduct_url || ""}
              name="code_of_conduct_url"
              placeholder="Existing Google Drive or hosted file link"
            />
          </label>
        </div>
      </>
    );
  }

  return null;
}

export function MemberProfileForm({
  action,
  cancelHref,
  cohorts,
  cohortProfile,
  currentCohorts,
  currentTags,
  flowMode = "edit",
  nextStepId = "",
  notice,
  noticeTone = "error",
  profile,
  remainingRequiredFields = [],
  resumeDownloadHref,
  section,
  submitLabel,
  tags,
  title = "Cohort onboarding profile",
}) {
  const isGuided = flowMode === "guided";
  const isReviewStep = section?.id === "review-confirm";

  return (
    <form action={action} className="form-card guided-profile-form">
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
        <div className="stack">
          <div className="field-summary-card">
            <strong>Required fields still missing</strong>
            <p>
              {remainingRequiredFields.length
                ? "Complete the remaining fields below to finish onboarding."
                : "Your core profile is complete. You can finish now and still edit later."}
            </p>
          </div>
          {remainingRequiredFields.length ? (
            <ul className="check-list">
              {remainingRequiredFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          ) : (
            <p className="form-success">Everything needed for activation is in place.</p>
          )}
        </div>
      ) : (
        renderSectionFields({
          cohorts,
          cohortProfile,
          currentCohorts,
          currentTags,
          profile,
          resumeDownloadHref,
          sectionId: section?.id,
          tags,
        })
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
              <button className="primary-button" name="intent" type="submit" value={isReviewStep ? "finish" : "continue"}>
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
