import { getCohortOnboardingConfig } from "@/lib/cohort-onboarding";
import {
  resolveCodeOfConductAsset,
  resolveNdaAsset,
  uploadCodeOfConductFile,
  uploadNdaFile,
} from "@/lib/member-compliance-documents";
import { resolveHeadshotAsset, uploadHeadshotFile } from "@/lib/member-headshots";
import { resolveResumeAsset, uploadResumeFile } from "@/lib/member-resumes";
import {
  isValidProfileAvailabilityStatus,
  isValidProfileVisibilitySetting,
} from "@/lib/profile-form-options";
import { buildProfileProgress } from "@/lib/profile-onboarding";
import {
  normaliseLanguages,
  normaliseRelevantProjects,
} from "@/lib/profile-structured-fields";

const PROFILE_BIO_MAX_LENGTH = 1200;

function parseOptionalText(formData, field) {
  return formData.has(field) ? String(formData.get(field) || "").trim() : undefined;
}

function parseOptionalTextarea(formData, field, maxLength = null) {
  if (!formData.has(field)) {
    return undefined;
  }

  const value = String(formData.get(field) || "").trim();
  return maxLength ? value.slice(0, maxLength) : value;
}

function resolveStoredDocumentOriginalUrl(previousAsset, nextAsset) {
  return (
    nextAsset?.original_url ||
    previousAsset?.original_url ||
    (previousAsset?.source_kind === "external" ? previousAsset.display_url : "")
  );
}

function getPersistFailureReason(error) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message.includes("maximum allowed size") || message.includes("object type is not supported")) {
    return "invalid-selection";
  }

  return "save-error";
}

export function parseMemberProfileFormData(formData) {
  const headshotFile = formData.get("headshot_file");
  const cvFile = formData.get("cv_file");
  const ndaFile = formData.get("nda_file");
  const codeOfConductFile = formData.get("code_of_conduct_file");
  const sectionId = String(formData.get("section_id") || "").trim();
  const relevantProjectTitles = formData.getAll("relevant_project_title");
  const relevantProjectLinks = formData.getAll("relevant_project_link");

  return {
    sectionId,
    flowMode: String(formData.get("flow_mode") || "edit").trim(),
    intent: String(formData.get("intent") || "save").trim(),
    nextStepId: String(formData.get("next_step_id") || "").trim(),
    firstName: parseOptionalText(formData, "first_name"),
    surname: parseOptionalText(formData, "surname"),
    title: parseOptionalText(formData, "title"),
    middleNames: parseOptionalText(formData, "middle_names"),
    roleTitle: parseOptionalText(formData, "role_title"),
    organisationName: parseOptionalText(formData, "organisation_name"),
    countryOfResidence: parseOptionalText(formData, "country_of_residence"),
    phoneNumber: parseOptionalText(formData, "phone_number"),
    whatsappNumber: parseOptionalText(formData, "whatsapp_number"),
    timezone: parseOptionalText(formData, "timezone"),
    availabilityStatus: parseOptionalText(formData, "availability_status"),
    professionalBio: parseOptionalTextarea(formData, "professional_bio", PROFILE_BIO_MAX_LENGTH),
    primaryCohortSlug: parseOptionalText(formData, "primary_cohort_slug"),
    visibilitySetting: parseOptionalText(formData, "visibility_setting"),
    gender: parseOptionalText(formData, "gender"),
    languages:
      sectionId === "identity-contact"
        ? normaliseLanguages({
            otherText: parseOptionalText(formData, "other_languages"),
            selected: formData.getAll("languages").map((value) => String(value || "").trim()),
          })
        : undefined,
    domainKnowledge: parseOptionalTextarea(formData, "domain_knowledge"),
    focusArea: parseOptionalTextarea(formData, "focus_area"),
    notableWork: parseOptionalTextarea(formData, "notable_work"),
    relevantProjects:
      sectionId === "expertise-collaboration"
        ? normaliseRelevantProjects(
            relevantProjectTitles.map((title, index) => ({
              title,
              link: relevantProjectLinks[index] || "",
            })),
          )
        : undefined,
    opportunityInterest: parseOptionalText(formData, "opportunity_interest"),
    additionalComments: parseOptionalTextarea(formData, "additional_comments"),
    currentHeadshotUrl: parseOptionalText(formData, "current_headshot_url") || "",
    headshotFile: typeof headshotFile?.arrayBuffer === "function" ? headshotFile : null,
    currentCvUrl: parseOptionalText(formData, "current_cv_url") || "",
    cvFile: typeof cvFile?.arrayBuffer === "function" ? cvFile : null,
    ndaFile: typeof ndaFile?.arrayBuffer === "function" ? ndaFile : null,
    ndaUrl: parseOptionalText(formData, "nda_url"),
    codeOfConductFile:
      typeof codeOfConductFile?.arrayBuffer === "function" ? codeOfConductFile : null,
    codeOfConductUrl: parseOptionalText(formData, "code_of_conduct_url"),
    tagSlugs:
      sectionId === "organisation-cohort"
        ? formData
            .getAll("domain_tag_slugs")
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        : undefined,
  };
}

export async function persistMemberProfile({
  adminSupabase,
  supabase,
  userId,
  values,
}) {
  const [{ data: cohorts }, { data: availableTags }, { data: existingProfile }, { data: existingCohortProfile }, { data: currentCohortRows }, { data: currentTagRows }] = await Promise.all([
    adminSupabase.from("cohorts").select("id, slug, name"),
    adminSupabase.from("domain_tags").select("id, slug, name"),
    supabase
      .from("profiles")
      .select(
        "id, title, first_name, surname, role_title, organisation_name, country_of_residence, professional_bio, visibility_setting, onboarding_status, onboarding_completed_at, phone_number, whatsapp_number, timezone, profile_status, availability_status",
      )
      .eq("id", userId)
      .maybeSingle(),
    adminSupabase
      .from("cohort_member_profiles")
      .select("source_cohort_id, source_submitted_at, middle_names, gender, languages, domain_knowledge, focus_area, notable_work, relevant_projects, opportunity_interest, additional_comments, headshot_url, cv_url, nda_url, code_of_conduct_url, completed_at, raw_responses")
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("user_cohorts")
      .select("cohort_id, is_primary, cohorts(name, slug)")
      .eq("user_id", userId),
    adminSupabase
      .from("user_tags")
      .select("tag_id, domain_tags(name, slug)")
      .eq("user_id", userId),
  ]);

  const currentPrimaryCohort = (currentCohortRows || []).find((item) => item.is_primary)?.cohorts || null;
  const selectedPrimaryCohort =
    values.primaryCohortSlug === undefined
      ? currentPrimaryCohort
      : (cohorts || []).find((cohort) => cohort.slug === values.primaryCohortSlug) || null;

  if (values.primaryCohortSlug !== undefined && values.primaryCohortSlug && !selectedPrimaryCohort) {
    return {
      ok: false,
      reason: "invalid-selection",
    };
  }

  const selectedTags =
    values.tagSlugs === undefined
      ? currentTagRows || []
      : (availableTags || []).filter((tag) => values.tagSlugs.includes(tag.slug));

  if (values.tagSlugs !== undefined && selectedTags.length !== new Set(values.tagSlugs).size) {
    return {
      ok: false,
      reason: "invalid-selection",
    };
  }

  if (
    (values.visibilitySetting !== undefined && !isValidProfileVisibilitySetting(values.visibilitySetting)) ||
    (values.availabilityStatus !== undefined && !isValidProfileAvailabilityStatus(values.availabilityStatus))
  ) {
    return {
      ok: false,
      reason: "invalid-selection",
    };
  }

  let headshotUrl =
    values.currentHeadshotUrl || existingCohortProfile?.headshot_url || "";
  const previousHeadshotAsset = resolveHeadshotAsset(headshotUrl, existingCohortProfile?.raw_responses);
  let headshotAsset = previousHeadshotAsset;
  let cvUrl = values.currentCvUrl || existingCohortProfile?.cv_url || "";
  const previousResumeAsset = resolveResumeAsset(cvUrl, existingCohortProfile?.raw_responses);
  let resumeAsset = previousResumeAsset;
  let ndaUrl = existingCohortProfile?.nda_url || "";
  const previousNdaAsset = resolveNdaAsset(ndaUrl, existingCohortProfile?.raw_responses);
  let ndaAsset = previousNdaAsset;
  let codeOfConductUrl = existingCohortProfile?.code_of_conduct_url || "";
  const previousCodeOfConductAsset = resolveCodeOfConductAsset(
    codeOfConductUrl,
    existingCohortProfile?.raw_responses,
  );
  let codeOfConductAsset = previousCodeOfConductAsset;

  try {
    if (values.ndaUrl !== undefined && (values.ndaUrl || ndaAsset.source_kind !== "storage")) {
      ndaUrl = values.ndaUrl || "";
      ndaAsset = resolveNdaAsset(ndaUrl);
    }

    if (
      values.codeOfConductUrl !== undefined &&
      (values.codeOfConductUrl || codeOfConductAsset.source_kind !== "storage")
    ) {
      codeOfConductUrl = values.codeOfConductUrl || "";
      codeOfConductAsset = resolveCodeOfConductAsset(codeOfConductUrl);
    }

    const uploadedHeadshot = await uploadHeadshotFile({
      adminSupabase,
      currentHeadshotUrl: headshotUrl,
      file: values.headshotFile,
      userId,
    });
    headshotUrl = uploadedHeadshot.headshotUrl;
    headshotAsset = uploadedHeadshot.asset;
    const uploadedResume = await uploadResumeFile({
      adminSupabase,
      currentCvUrl: cvUrl,
      file: values.cvFile,
      userId,
    });
    cvUrl = uploadedResume.cvUrl;
    resumeAsset = uploadedResume.asset;
    const uploadedNda = await uploadNdaFile({
      adminSupabase,
      currentNdaUrl: ndaUrl,
      file: values.ndaFile,
      userId,
    });
    ndaUrl = uploadedNda.ndaUrl;
    ndaAsset = uploadedNda.asset;
    const uploadedCodeOfConduct = await uploadCodeOfConductFile({
      adminSupabase,
      currentCodeOfConductUrl: codeOfConductUrl,
      file: values.codeOfConductFile,
      userId,
    });
    codeOfConductUrl = uploadedCodeOfConduct.codeOfConductUrl;
    codeOfConductAsset = uploadedCodeOfConduct.asset;
  } catch (error) {
    return {
      ok: false,
      reason: getPersistFailureReason(error),
    };
  }

  const mergedProfile = {
    ...existingProfile,
    title: values.title !== undefined ? values.title || null : existingProfile?.title || null,
    first_name:
      values.firstName !== undefined ? values.firstName || null : existingProfile?.first_name || null,
    surname: values.surname !== undefined ? values.surname || null : existingProfile?.surname || null,
    role_title:
      values.roleTitle !== undefined ? values.roleTitle || null : existingProfile?.role_title || null,
    organisation_name:
      values.organisationName !== undefined
        ? values.organisationName || null
        : existingProfile?.organisation_name || null,
    country_of_residence:
      values.countryOfResidence !== undefined
        ? values.countryOfResidence || null
        : existingProfile?.country_of_residence || null,
    phone_number:
      values.phoneNumber !== undefined ? values.phoneNumber || null : existingProfile?.phone_number || null,
    whatsapp_number:
      values.whatsappNumber !== undefined
        ? values.whatsappNumber || null
        : existingProfile?.whatsapp_number || null,
    timezone: values.timezone !== undefined ? values.timezone || null : existingProfile?.timezone || null,
    profile_status: existingProfile?.profile_status || "active",
    availability_status:
      values.availabilityStatus !== undefined
        ? values.availabilityStatus || "available"
        : existingProfile?.availability_status || "available",
    professional_bio:
      values.professionalBio !== undefined
        ? values.professionalBio || null
        : existingProfile?.professional_bio || null,
    visibility_setting:
      values.visibilitySetting !== undefined
        ? values.visibilitySetting || "members_only"
        : existingProfile?.visibility_setting || "members_only",
  };
  const mergedCohortProfile = {
    ...existingCohortProfile,
    middle_names:
      values.middleNames !== undefined ? values.middleNames || null : existingCohortProfile?.middle_names || null,
    gender: values.gender !== undefined ? values.gender || null : existingCohortProfile?.gender || null,
    languages: values.languages !== undefined ? values.languages : existingCohortProfile?.languages || [],
    domain_knowledge:
      values.domainKnowledge !== undefined
        ? values.domainKnowledge || null
        : existingCohortProfile?.domain_knowledge || null,
    focus_area:
      values.focusArea !== undefined ? values.focusArea || null : existingCohortProfile?.focus_area || null,
    notable_work:
      values.notableWork !== undefined
        ? values.notableWork || null
        : existingCohortProfile?.notable_work || null,
    relevant_projects:
      values.relevantProjects !== undefined
        ? values.relevantProjects
        : existingCohortProfile?.relevant_projects || [],
    opportunity_interest:
      values.opportunityInterest !== undefined
        ? values.opportunityInterest || null
        : existingCohortProfile?.opportunity_interest || null,
    additional_comments:
      values.additionalComments !== undefined
        ? values.additionalComments || null
        : existingCohortProfile?.additional_comments || null,
    headshot_url: headshotUrl || null,
    cv_url: cvUrl || null,
    nda_url: ndaUrl || null,
    code_of_conduct_url: codeOfConductUrl || null,
  };
  const progress = buildProfileProgress({
    cohortProfile: mergedCohortProfile,
    domainTags:
      values.tagSlugs === undefined
        ? (currentTagRows || []).map((row) => row.domain_tags).filter(Boolean)
        : selectedTags,
    primaryCohort: selectedPrimaryCohort,
    profile: mergedProfile,
  });
  const completedAt = progress.isOnboardingComplete
    ? existingProfile?.onboarding_completed_at || new Date().toISOString()
    : existingProfile?.onboarding_completed_at || null;
  const nextOnboardingStatus = progress.isOnboardingComplete
    ? "active"
    : existingProfile?.onboarding_status === "active"
      ? "active"
      : "profile_pending";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      title: mergedProfile.title,
      first_name: mergedProfile.first_name,
      surname: mergedProfile.surname,
      role_title: mergedProfile.role_title,
      organisation_name: mergedProfile.organisation_name,
      country_of_residence: mergedProfile.country_of_residence,
      professional_bio: mergedProfile.professional_bio,
      visibility_setting: mergedProfile.visibility_setting,
      phone_number: mergedProfile.phone_number,
      whatsapp_number: mergedProfile.whatsapp_number,
      timezone: mergedProfile.timezone,
      availability_status: mergedProfile.availability_status,
      onboarding_status: nextOnboardingStatus,
      onboarding_completed_at: completedAt,
    })
    .eq("id", userId);

  if (profileError) {
    return {
      ok: false,
      reason: "save-error",
    };
  }

  if (values.primaryCohortSlug !== undefined) {
    const { error: clearPrimaryError } = await adminSupabase
      .from("user_cohorts")
      .update({ is_primary: false })
      .eq("user_id", userId);

    if (clearPrimaryError) {
      return {
        ok: false,
        reason: "save-error",
      };
    }

    if (selectedPrimaryCohort) {
      const { error: cohortError } = await adminSupabase
        .from("user_cohorts")
        .upsert(
          {
            user_id: userId,
            cohort_id: selectedPrimaryCohort.id,
            is_primary: true,
          },
          { onConflict: "user_id,cohort_id" },
        );

      if (cohortError) {
        return {
          ok: false,
          reason: "save-error",
        };
      }
    }
  }

  if (values.tagSlugs !== undefined) {
    const { error: tagDeleteError } = await adminSupabase.from("user_tags").delete().eq("user_id", userId);

    if (tagDeleteError) {
      return {
        ok: false,
        reason: "save-error",
      };
    }

    if (selectedTags.length) {
      const { error: tagInsertError } = await adminSupabase.from("user_tags").insert(
        selectedTags.map((tag) => ({
          user_id: userId,
          tag_id: tag.id,
        })),
      );

      if (tagInsertError) {
        return {
          ok: false,
          reason: "save-error",
        };
      }
    }
  }

  const formConfig = getCohortOnboardingConfig(selectedPrimaryCohort?.slug);
  const rawResponses = {
    ...(existingCohortProfile?.raw_responses || {}),
    cohort_slug: selectedPrimaryCohort?.slug || null,
    cohort_title: formConfig.title,
    middle_names: mergedCohortProfile.middle_names,
    gender: mergedCohortProfile.gender,
    languages: mergedCohortProfile.languages,
    domain_knowledge: mergedCohortProfile.domain_knowledge,
    focus_area: mergedCohortProfile.focus_area,
    notable_work: mergedCohortProfile.notable_work,
    relevant_projects: mergedCohortProfile.relevant_projects,
    opportunity_interest: mergedCohortProfile.opportunity_interest,
    additional_comments: mergedCohortProfile.additional_comments,
    headshot_url: headshotUrl || null,
    headshot_source_kind: headshotAsset.source_kind,
    headshot_storage_path: headshotAsset.storage_path || null,
    headshot_original_url: resolveStoredDocumentOriginalUrl(previousHeadshotAsset, headshotAsset) || null,
    cv_url: cvUrl || null,
    cv_source_kind: resumeAsset.source_kind,
    cv_storage_path: resumeAsset.storage_path || null,
    cv_original_url: resolveStoredDocumentOriginalUrl(previousResumeAsset, resumeAsset) || null,
    nda_url: mergedCohortProfile.nda_url,
    nda_source_kind: ndaAsset.source_kind,
    nda_storage_path: ndaAsset.storage_path || null,
    nda_original_url: resolveStoredDocumentOriginalUrl(previousNdaAsset, ndaAsset) || null,
    code_of_conduct_url: mergedCohortProfile.code_of_conduct_url,
    code_of_conduct_source_kind: codeOfConductAsset.source_kind,
    code_of_conduct_storage_path: codeOfConductAsset.storage_path || null,
    code_of_conduct_original_url:
      resolveStoredDocumentOriginalUrl(previousCodeOfConductAsset, codeOfConductAsset) || null,
  };
  const { error: cohortProfileError } = await adminSupabase.from("cohort_member_profiles").upsert(
    {
      user_id: userId,
      source_cohort_id: selectedPrimaryCohort?.id || existingCohortProfile?.source_cohort_id || null,
      source_submitted_at: existingCohortProfile?.source_submitted_at || null,
      middle_names: mergedCohortProfile.middle_names,
      gender: mergedCohortProfile.gender,
      languages: mergedCohortProfile.languages,
      domain_knowledge: mergedCohortProfile.domain_knowledge,
      focus_area: mergedCohortProfile.focus_area,
      notable_work: mergedCohortProfile.notable_work,
      relevant_projects: mergedCohortProfile.relevant_projects,
      opportunity_interest: mergedCohortProfile.opportunity_interest,
      additional_comments: mergedCohortProfile.additional_comments,
      headshot_url: headshotUrl || null,
      cv_url: cvUrl || null,
      nda_url: mergedCohortProfile.nda_url,
      code_of_conduct_url: mergedCohortProfile.code_of_conduct_url,
      completed_at: progress.isOnboardingComplete
        ? existingCohortProfile?.completed_at || completedAt
        : existingCohortProfile?.completed_at || null,
      raw_responses: rawResponses,
    },
    { onConflict: "user_id" },
  );

  if (cohortProfileError) {
    return {
      ok: false,
      reason: "save-error",
    };
  }

  return {
    ok: true,
    firstIncompleteSection: progress.firstIncompleteSection,
    isComplete: progress.isOnboardingComplete,
  };
}

export async function replaceMemberHeadshot({
  adminSupabase,
  file,
  updatedByUserId,
  userId,
}) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return {
      ok: false,
      reason: "missing-file",
    };
  }

  const [{ data: existingCohortProfile }, { data: primaryCohortRow }] = await Promise.all([
    adminSupabase
      .from("cohort_member_profiles")
      .select(
        "source_cohort_id, source_submitted_at, middle_names, gender, languages, domain_knowledge, focus_area, notable_work, opportunity_interest, additional_comments, headshot_url, cv_url, nda_url, code_of_conduct_url, completed_at, raw_responses",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("user_cohorts")
      .select("cohort_id")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  try {
    const previousAsset = resolveHeadshotAsset(
      existingCohortProfile?.headshot_url,
      existingCohortProfile?.raw_responses,
    );
    const uploadedHeadshot = await uploadHeadshotFile({
      adminSupabase,
      currentHeadshotUrl: existingCohortProfile?.headshot_url || "",
      file,
      userId,
    });
    const recoveredAt = new Date().toISOString();
    const rawResponses = {
      ...(existingCohortProfile?.raw_responses || {}),
      headshot_url: uploadedHeadshot.headshotUrl,
      headshot_source_kind: "storage",
      headshot_storage_path: uploadedHeadshot.asset.storage_path || null,
      headshot_original_url:
        previousAsset.original_url || previousAsset.display_url || uploadedHeadshot.asset.original_url || null,
      headshot_recovered_at: recoveredAt,
      headshot_recovered_by_user_id: updatedByUserId,
    };
    const { error } = await adminSupabase.from("cohort_member_profiles").upsert(
      {
        user_id: userId,
        source_cohort_id: existingCohortProfile?.source_cohort_id || primaryCohortRow?.cohort_id || null,
        source_submitted_at: existingCohortProfile?.source_submitted_at || null,
        middle_names: existingCohortProfile?.middle_names || null,
        gender: existingCohortProfile?.gender || null,
        languages: existingCohortProfile?.languages || [],
        domain_knowledge: existingCohortProfile?.domain_knowledge || null,
        focus_area: existingCohortProfile?.focus_area || null,
        notable_work: existingCohortProfile?.notable_work || null,
        opportunity_interest: existingCohortProfile?.opportunity_interest || null,
        additional_comments: existingCohortProfile?.additional_comments || null,
        headshot_url: uploadedHeadshot.headshotUrl,
        cv_url: existingCohortProfile?.cv_url || null,
        nda_url: existingCohortProfile?.nda_url || null,
        code_of_conduct_url: existingCohortProfile?.code_of_conduct_url || null,
        completed_at: existingCohortProfile?.completed_at || null,
        raw_responses: rawResponses,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return {
        ok: false,
        reason: "save-error",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");

    return {
      ok: false,
      reason: message.includes("maximum allowed size") ? "file-too-large" : "save-error",
    };
  }
}

export async function replaceMemberResume({
  adminSupabase,
  file,
  updatedByUserId,
  userId,
}) {
  const size = Number(file?.size || 0);

  if (!file || size === 0) {
    return {
      ok: false,
      reason: "missing-file",
    };
  }

  const [{ data: existingCohortProfile }, { data: primaryCohortRow }] = await Promise.all([
    adminSupabase
      .from("cohort_member_profiles")
      .select(
        "source_cohort_id, source_submitted_at, middle_names, gender, languages, domain_knowledge, focus_area, notable_work, opportunity_interest, additional_comments, headshot_url, cv_url, nda_url, code_of_conduct_url, completed_at, raw_responses",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("user_cohorts")
      .select("cohort_id")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  try {
    const previousAsset = resolveResumeAsset(
      existingCohortProfile?.cv_url,
      existingCohortProfile?.raw_responses,
    );
    const uploadedResume = await uploadResumeFile({
      adminSupabase,
      currentCvUrl: existingCohortProfile?.cv_url || "",
      file,
      userId,
    });
    const recoveredAt = new Date().toISOString();
    const rawResponses = {
      ...(existingCohortProfile?.raw_responses || {}),
      cv_url: uploadedResume.cvUrl,
      cv_source_kind: "storage",
      cv_storage_path: uploadedResume.asset.storage_path || null,
      cv_original_url:
        previousAsset.original_url || previousAsset.display_url || uploadedResume.asset.original_url || null,
      cv_recovered_at: recoveredAt,
      cv_recovered_by_user_id: updatedByUserId,
    };
    const { error } = await adminSupabase.from("cohort_member_profiles").upsert(
      {
        user_id: userId,
        source_cohort_id: existingCohortProfile?.source_cohort_id || primaryCohortRow?.cohort_id || null,
        source_submitted_at: existingCohortProfile?.source_submitted_at || null,
        middle_names: existingCohortProfile?.middle_names || null,
        gender: existingCohortProfile?.gender || null,
        languages: existingCohortProfile?.languages || [],
        domain_knowledge: existingCohortProfile?.domain_knowledge || null,
        focus_area: existingCohortProfile?.focus_area || null,
        notable_work: existingCohortProfile?.notable_work || null,
        opportunity_interest: existingCohortProfile?.opportunity_interest || null,
        additional_comments: existingCohortProfile?.additional_comments || null,
        headshot_url: existingCohortProfile?.headshot_url || null,
        cv_url: uploadedResume.cvUrl,
        nda_url: existingCohortProfile?.nda_url || null,
        code_of_conduct_url: existingCohortProfile?.code_of_conduct_url || null,
        completed_at: existingCohortProfile?.completed_at || null,
        raw_responses: rawResponses,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return {
        ok: false,
        reason: "save-error",
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");

    return {
      ok: false,
      reason: message.includes("maximum allowed size") ? "file-too-large" : "save-error",
    };
  }
}
