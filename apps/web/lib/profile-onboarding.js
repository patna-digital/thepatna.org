const REQUIRED_FIELD_LABELS = {
  first_name: "First name",
  surname: "Surname",
  role_title: "Role title",
  organisation_name: "Organisation",
  country_of_residence: "Country of residence",
  phone_number: "Phone number",
  whatsapp_number: "WhatsApp number",
  timezone: "Timezone",
  primary_cohort: "Primary cohort",
  domain_tags: "Domain tags",
  domain_knowledge: "Domain knowledge",
  focus_area: "Current focus",
};

export const PROFILE_SECTION_ORDER = [
  "identity-contact",
  "organisation-cohort",
  "expertise-collaboration",
  "visibility-files",
  "review-confirm",
];

export const PROFILE_SECTIONS = [
  {
    id: "identity-contact",
    label: "Identity and contact",
    description: "Add your basic profile and coordination details.",
    fields: [
      "email",
      "title",
      "middle_names",
      "first_name",
      "surname",
      "phone_number",
      "whatsapp_number",
      "timezone",
      "gender",
      "languages",
    ],
    requiredFields: ["first_name", "surname", "phone_number", "whatsapp_number", "timezone"],
  },
  {
    id: "organisation-cohort",
    label: "Organisation and cohort",
    description: "Anchor your PATNA profile in the right institution and cohort.",
    fields: [
      "role_title",
      "organisation_name",
      "country_of_residence",
      "primary_cohort",
      "domain_tags",
    ],
    requiredFields: [
      "role_title",
      "organisation_name",
      "country_of_residence",
      "primary_cohort",
      "domain_tags",
    ],
  },
  {
    id: "expertise-collaboration",
    label: "Expertise and collaboration",
    description: "Describe your competence, focus, and collaboration interests.",
    fields: [
      "professional_bio",
      "domain_knowledge",
      "focus_area",
      "notable_work",
      "opportunity_interest",
      "additional_comments",
    ],
    requiredFields: ["domain_knowledge", "focus_area"],
  },
  {
    id: "visibility-files",
    label: "Visibility and supporting files",
    description: "Add files and choose how your profile should be surfaced.",
    fields: [
      "visibility_setting",
      "headshot_file",
      "cv_file",
      "nda_url",
      "code_of_conduct_url",
    ],
    requiredFields: [],
  },
  {
    id: "review-confirm",
    label: "Review and confirm",
    description: "Check what is still missing and confirm your profile is collaboration-ready.",
    fields: [],
    requiredFields: [],
  },
];

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function countCompleted(requiredFields, completedKeys) {
  if (!requiredFields.length) {
    return 0;
  }

  return requiredFields.filter((key) => completedKeys.has(key)).length;
}

export function normaliseProfileSectionId(value) {
  const requested = String(value || "").trim();
  return PROFILE_SECTION_ORDER.includes(requested) ? requested : "";
}

export function getNextProfileSectionId(sectionId) {
  const index = PROFILE_SECTION_ORDER.indexOf(sectionId);

  if (index === -1 || index === PROFILE_SECTION_ORDER.length - 1) {
    return "";
  }

  return PROFILE_SECTION_ORDER[index + 1];
}

export function getPreviousProfileSectionId(sectionId) {
  const index = PROFILE_SECTION_ORDER.indexOf(sectionId);

  if (index <= 0) {
    return "";
  }

  return PROFILE_SECTION_ORDER[index - 1];
}

export function buildProfileProgress({
  cohortProfile,
  domainTags,
  primaryCohort,
  profile,
}) {
  const completedKeys = new Set();

  if (hasText(profile?.first_name)) completedKeys.add("first_name");
  if (hasText(profile?.surname)) completedKeys.add("surname");
  if (hasText(profile?.role_title)) completedKeys.add("role_title");
  if (hasText(profile?.organisation_name)) completedKeys.add("organisation_name");
  if (hasText(profile?.country_of_residence)) completedKeys.add("country_of_residence");
  if (hasText(profile?.phone_number)) completedKeys.add("phone_number");
  if (hasText(profile?.whatsapp_number)) completedKeys.add("whatsapp_number");
  if (hasText(profile?.timezone)) completedKeys.add("timezone");
  if (primaryCohort) completedKeys.add("primary_cohort");
  if ((domainTags || []).length > 0) completedKeys.add("domain_tags");
  if (hasText(cohortProfile?.domain_knowledge)) completedKeys.add("domain_knowledge");
  if (hasText(cohortProfile?.focus_area)) completedKeys.add("focus_area");

  const requiredFieldKeys = Object.keys(REQUIRED_FIELD_LABELS);
  const remainingRequiredFields = requiredFieldKeys
    .filter((key) => !completedKeys.has(key))
    .map((key) => REQUIRED_FIELD_LABELS[key]);
  const completionPercent = Math.round((completedKeys.size / requiredFieldKeys.length) * 100);

  const sectionStatus = PROFILE_SECTIONS.map((section) => {
    const requiredCount = section.requiredFields.length;
    const completedCount = countCompleted(section.requiredFields, completedKeys);
    const isComplete = requiredCount === 0 ? completedKeys.size === requiredFieldKeys.length : completedCount === requiredCount;

    return {
      id: section.id,
      label: section.label,
      description: section.description,
      requiredFields: section.requiredFields.map((field) => REQUIRED_FIELD_LABELS[field]).filter(Boolean),
      isComplete,
      completionPercent:
        requiredCount === 0
          ? completedKeys.size === requiredFieldKeys.length
            ? 100
            : 0
          : Math.round((completedCount / requiredCount) * 100),
    };
  });

  const firstIncompleteSection =
    sectionStatus.find((section) => section.id !== "review-confirm" && !section.isComplete)?.id || "review-confirm";

  return {
    completionPercent,
    completedSections: sectionStatus.filter((section) => section.isComplete).map((section) => section.id),
    firstIncompleteSection,
    isOnboardingComplete: remainingRequiredFields.length === 0,
    missingProfileFields: remainingRequiredFields,
    remainingRequiredFields,
    sectionStatus,
  };
}
