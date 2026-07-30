import Link from "next/link";
import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import {
  PROFILE_AVAILABILITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
} from "@/lib/profile-form-options";
import {
  getCountryNameByCodeFromOptions,
  resolveCountryOption,
  toCountryOptions,
} from "@/lib/countries";
import { splitLanguages, STANDARD_LANGUAGE_OPTIONS } from "@/lib/profile-structured-fields";
import { RelevantProjectsFields } from "@/components/relevant-projects-fields";

export function Field({ children, help = "", label, className = "" }) {
  return (
    <label className={`member-profile-field${className ? ` ${className}` : ""}`}>
      <span className="member-profile-field-label">{label}</span>
      {children}
      {help ? <span className="member-profile-field-help">{help}</span> : null}
    </label>
  );
}

export function ChoiceCard({
  defaultChecked = false,
  label,
  name,
  type = "checkbox",
  value,
}) {
  return (
    <label className="member-profile-choice-card">
      <input defaultChecked={defaultChecked} name={name} type={type} value={value} />
      <span>{label}</span>
    </label>
  );
}

export function ChoiceFieldset({ children, description = "", legend }) {
  return (
    <fieldset className="member-profile-choice-fieldset">
      <legend>{legend}</legend>
      {description ? <p className="member-profile-choice-description">{description}</p> : null}
      <div className="member-profile-choice-grid">{children}</div>
    </fieldset>
  );
}

function DocumentTile({
  accept,
  currentHref = "",
  currentLabel = "Open current file",
  currentValue = "",
  currentValueName = "",
  description,
  emptyLabel = "No file uploaded yet",
  extra = null,
  helper = "",
  inputLabel = "Choose file",
  name,
  preview = null,
  title,
}) {
  return (
    <article className="member-document-tile">
      <div className="member-document-tile-head">
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
        {currentHref ? (
          <Link className="member-document-tile-link" href={currentHref}>
            {currentLabel}
          </Link>
        ) : (
          <span className="member-document-tile-status">{emptyLabel}</span>
        )}
      </div>

      {preview ? <div className="member-document-tile-preview">{preview}</div> : null}
      {currentValueName ? <input name={currentValueName} type="hidden" value={currentValue} /> : null}

      <label className="member-document-upload">
        <span>{inputLabel}</span>
        <input accept={accept} name={name} type="file" />
      </label>
      {helper ? <p className="member-profile-field-help member-document-upload-help">{helper}</p> : null}
      {extra}
    </article>
  );
}

export function MemberProfileSectionFields({
  codeOfConductDownloadHref = "",
  cohortProfile,
  cohorts,
  countries = [],
  currentCohorts,
  currentTags,
  ndaDownloadHref = "",
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
  const ndaLegacyUrl =
    profile?.ndaAsset?.source_kind === "external"
      ? profile.ndaAsset.original_url || profile.ndaAsset.display_url
      : "";
  const codeOfConductLegacyUrl =
    profile?.codeOfConductAsset?.source_kind === "external"
      ? profile.codeOfConductAsset.original_url || profile.codeOfConductAsset.display_url
      : "";

  if (sectionId === "identity-contact") {
    return (
      <>
        <Field className="member-profile-field-readonly" label="Email">
          <input defaultValue={profile?.email || ""} readOnly />
        </Field>

        <div className="two-column-grid member-profile-grid-gap">
          <Field label="Title">
            <input defaultValue={profile?.title || ""} name="title" placeholder="Dr." />
          </Field>
          <Field label="Middle name(s)">
            <input defaultValue={cohortProfile?.middle_names || ""} name="middle_names" placeholder="Middle name(s)" />
          </Field>
          <Field label="First name">
            <input defaultValue={profile?.first_name || ""} name="first_name" placeholder="First name" />
          </Field>
          <Field label="Surname">
            <input defaultValue={profile?.surname || ""} name="surname" placeholder="Surname" />
          </Field>
        </div>

        <div className="two-column-grid member-profile-grid-gap">
          <Field label="Phone number">
            <input defaultValue={profile?.phone_number || ""} name="phone_number" placeholder="+234..." />
          </Field>
          <Field label="WhatsApp number">
            <input defaultValue={profile?.whatsapp_number || ""} name="whatsapp_number" placeholder="+234..." />
          </Field>
          <Field label="Timezone">
            <input defaultValue={profile?.timezone || ""} name="timezone" placeholder="Africa/Lagos" />
          </Field>
          <Field label="Gender">
            <input defaultValue={cohortProfile?.gender || ""} name="gender" placeholder="Gender" />
          </Field>
        </div>

        <ChoiceFieldset
          description="Choose the languages other PATNA members can rely on when coordinating with you."
          legend="Languages"
        >
          {STANDARD_LANGUAGE_OPTIONS.map((language) => (
            <ChoiceCard
              defaultChecked={selectedLanguages.includes(language)}
              key={language}
              label={language}
              name="languages"
              value={language}
            />
          ))}
        </ChoiceFieldset>

        <Field label="Other languages">
          <input
            defaultValue={otherLanguages}
            name="other_languages"
            placeholder="Add any other languages, separated by commas"
          />
        </Field>
      </>
    );
  }

  if (sectionId === "organisation-cohort") {
    const countryOptions = toCountryOptions(countries);
    const selectedCountryCode =
      profile?.country_code ||
      resolveCountryOption({ countries, name: profile?.country_of_residence })?.code ||
      "";
    const selectedCountryName =
      profile?.country_of_residence ||
      getCountryNameByCodeFromOptions(selectedCountryCode, countries);

    return (
      <>
        <div className="two-column-grid member-profile-grid-gap">
          <Field label="Role title">
            <input defaultValue={profile?.role_title || ""} name="role_title" placeholder="Policy Adviser" />
          </Field>
          <Field label="Organisation">
            <input
              defaultValue={profile?.organisation_name || ""}
              name="organisation_name"
              placeholder="Organisation or institution"
            />
          </Field>
          <Field label="Country of residence">
            <input name="country_of_residence" type="hidden" value={selectedCountryName || ""} />
            <select defaultValue={selectedCountryCode} name="country_code">
              <option value="">Select a country</option>
              {countryOptions.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primary cohort">
            <select defaultValue={primaryCohortSlug} name="primary_cohort_slug">
              <option value="">Select a cohort</option>
              {cohorts?.map((cohort) => (
                <option key={cohort.id} value={cohort.slug}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <ChoiceFieldset
          description="Highlight the agendas and policy areas where you most want to be found."
          legend="Domain tags"
        >
          {tags?.map((tag) => (
            <ChoiceCard
              defaultChecked={selectedTagSlugs.includes(tag.slug)}
              key={tag.id}
              label={tag.name}
              name="domain_tag_slugs"
              value={tag.slug}
            />
          ))}
        </ChoiceFieldset>
      </>
    );
  }

  if (sectionId === "expertise-collaboration") {
    return (
      <>
        <Field help="A concise introduction that helps other members understand your current role and work." label="Professional bio">
          <textarea
            defaultValue={profile?.professional_bio || ""}
            name="professional_bio"
            placeholder="Short professional biography"
          />
        </Field>
        <Field label="Domain knowledge / areas of competence">
          <textarea
            defaultValue={cohortProfile?.domain_knowledge || ""}
            name="domain_knowledge"
            placeholder="Describe your key areas of competence."
          />
        </Field>
        <Field label={formConfig.focusLabel}>
          <textarea
            defaultValue={cohortProfile?.focus_area || ""}
            name="focus_area"
            placeholder={formConfig.focusPlaceholder}
          />
        </Field>
        <Field label={formConfig.notableWorkLabel}>
          <textarea
            defaultValue={cohortProfile?.notable_work || ""}
            name="notable_work"
            placeholder={formConfig.notableWorkPlaceholder}
          />
        </Field>

        <section className="member-profile-subsection">
          <div className="member-profile-subsection-copy">
            <strong>Relevant projects</strong>
            <p>Add each project separately with its title and a link.</p>
          </div>
          <RelevantProjectsFields initialProjects={cohortProfile?.relevant_projects || []} />
        </section>

        <Field label="Collaboration, mentorship, or review interest">
          <input
            defaultValue={cohortProfile?.opportunity_interest || ""}
            name="opportunity_interest"
            placeholder="Yes / No / Short note"
          />
        </Field>
        <Field label="Additional comments">
          <textarea
            defaultValue={cohortProfile?.additional_comments || ""}
            name="additional_comments"
            placeholder="Anything else PATNA should know."
          />
        </Field>
      </>
    );
  }

  if (sectionId === "visibility-files") {
    return (
      <>
        <ChoiceFieldset
          description="Choose how your PATNA profile should be surfaced to the wider member workspace."
          legend="Visibility"
        >
          {PROFILE_VISIBILITY_OPTIONS.map((option) => (
            <ChoiceCard
              defaultChecked={(profile?.visibility_setting || "members_only") === option.value}
              key={option.value}
              label={option.label}
              name="visibility_setting"
              type="radio"
              value={option.value}
            />
          ))}
        </ChoiceFieldset>

        <ChoiceFieldset
          description="Let PATNA members know whether you are currently open to collaboration and requests."
          legend="Collaboration availability"
        >
          {PROFILE_AVAILABILITY_OPTIONS.map((option) => (
            <ChoiceCard
              defaultChecked={(profile?.availability_status || "available") === option.value}
              key={option.value}
              label={option.label}
              name="availability_status"
              type="radio"
              value={option.value}
            />
          ))}
        </ChoiceFieldset>

        <section className="member-profile-supporting-copy">
          <strong>Supporting files</strong>
          <p>
            Keep your core PATNA profile ready for collaboration with a clear headshot, current resume,
            and securely stored signed compliance documents.
          </p>
        </section>

        <div className="member-document-grid">
          <DocumentTile
            accept="image/png,image/jpeg,image/webp"
            currentValue={cohortProfile?.headshot_url || ""}
            currentValueName="current_headshot_url"
            description="Your headshot appears across the member directory, spaces, and booking profile."
            emptyLabel={profile?.headshotSrc ? "Current headshot shown" : "No headshot uploaded yet"}
            helper="Leave blank to keep the current headshot."
            inputLabel={profile?.headshotSrc ? "Replace headshot" : "Upload headshot"}
            name="headshot_file"
            preview={
              profile?.headshotSrc ? (
                <img
                  alt={`${profile.displayName || "PATNA member"} headshot`}
                  className="member-document-preview-image"
                  src={profile.headshotSrc}
                />
              ) : null
            }
            title="Profile headshot"
          />

          <DocumentTile
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            currentHref={resumeDownloadHref}
            currentLabel="Open current resume"
            currentValue={cohortProfile?.cv_url || ""}
            currentValueName="current_cv_url"
            description="Your CV or resume helps other members understand your experience quickly."
            emptyLabel={cohortProfile?.cv_url ? "Resume stored" : "No resume uploaded yet"}
            helper="PDF, DOC, or DOCX up to 100MB."
            inputLabel={resumeDownloadHref ? "Replace resume" : "Upload resume"}
            name="cv_file"
            title="CV or resume"
          />

          <DocumentTile
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            currentHref={ndaDownloadHref}
            currentLabel="Open signed NDA"
            description="Upload the signed PATNA NDA securely, or preserve an older hosted copy during transition."
            helper="PDF, DOC, DOCX, JPG, or PNG up to 100MB."
            inputLabel={ndaDownloadHref ? "Replace NDA" : "Upload signed NDA"}
            name="nda_file"
            title="Signed NDA"
            extra={
              <Field
                className="member-profile-field-compact"
                help="Optional. Keep or replace a legacy external link while PATNA transitions older records."
                label="Legacy hosted link"
              >
                <input defaultValue={ndaLegacyUrl} name="nda_url" placeholder="https://..." />
              </Field>
            }
          />

          <DocumentTile
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
            currentHref={codeOfConductDownloadHref}
            currentLabel="Open signed Code of Conduct"
            description="Store the signed Code of Conduct privately so PATNA admins and the member can access it when needed."
            helper="PDF, DOC, DOCX, JPG, or PNG up to 100MB."
            inputLabel={codeOfConductDownloadHref ? "Replace document" : "Upload signed document"}
            name="code_of_conduct_file"
            title="Signed Code of Conduct"
            extra={
              <Field
                className="member-profile-field-compact"
                help="Optional. Keep or replace a legacy external link while PATNA transitions older records."
                label="Legacy hosted link"
              >
                <input
                  defaultValue={codeOfConductLegacyUrl}
                  name="code_of_conduct_url"
                  placeholder="https://..."
                />
              </Field>
            }
          />
        </div>
      </>
    );
  }

  return null;
}

export function MemberProfileReviewSummary({ remainingRequiredFields = [], reviewLinks = [] }) {
  const incompleteLinks = reviewLinks.filter((item) => !item.isComplete);

  return (
    <div className="member-review-stack">
      <div className="member-profile-supporting-copy member-review-hero">
        <strong>{remainingRequiredFields.length ? "Required fields still missing" : "Ready to finish"}</strong>
        <p>
          {remainingRequiredFields.length
            ? "Use the section cards below to jump straight to the remaining blockers."
            : "Your core PATNA profile is complete. Finish onboarding to open your setup launchpad."}
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

      {incompleteLinks.length ? (
        <div className="member-review-links">
          {incompleteLinks.map((item) => (
            <Link className="member-review-link-card" href={item.href} key={item.id}>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
              <span>{item.requiredFields?.length ? item.requiredFields.join(", ") : "Return to this section"}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
