"use server";

import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function submitCommunityApplicationAction(_previousState, formData) {
  if (!canUseSupabaseAdmin()) {
    return {
      status: "error",
      message:
        "Supabase admin access is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY before testing application submission.",
    };
  }

  const firstName = String(formData.get("first_name") || "").trim();
  const surname = String(formData.get("surname") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const country = String(formData.get("country") || "").trim();
  const organisation = String(formData.get("organisation") || "").trim();
  const roleTitle = String(formData.get("role_title") || "").trim();
  const motivationText = String(formData.get("motivation_text") || "").trim();
  const cohortSlugs = formData
    .getAll("cohort_interests")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const tagSlugs = formData
    .getAll("domain_interests")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!firstName || !surname || !email || !motivationText) {
    return {
      status: "error",
      message: "First name, surname, email, and motivation are required.",
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data: application, error: applicationError } = await supabase
    .from("community_applications")
    .insert({
      submitted_by_email: email,
      first_name: firstName,
      surname,
      country: country || null,
      organisation: organisation || null,
      role_title: roleTitle || null,
      motivation_text: motivationText,
    })
    .select("id")
    .single();

  if (applicationError) {
    return {
      status: "error",
      message: applicationError.message,
    };
  }

  if (cohortSlugs.length > 0) {
    const { data: cohorts, error: cohortLookupError } = await supabase
      .from("cohorts")
      .select("id, slug")
      .in("slug", cohortSlugs);

    if (cohortLookupError) {
      return {
        status: "error",
        message: cohortLookupError.message,
      };
    }

    if (cohorts?.length) {
      const { error: cohortInsertError } = await supabase
        .from("application_cohort_interests")
        .insert(cohorts.map((cohort) => ({ application_id: application.id, cohort_id: cohort.id })));

      if (cohortInsertError) {
        return {
          status: "error",
          message: cohortInsertError.message,
        };
      }
    }
  }

  if (tagSlugs.length > 0) {
    const { data: tags, error: tagLookupError } = await supabase
      .from("domain_tags")
      .select("id, slug")
      .in("slug", tagSlugs);

    if (tagLookupError) {
      return {
        status: "error",
        message: tagLookupError.message,
      };
    }

    if (tags?.length) {
      const { error: tagInsertError } = await supabase
        .from("application_tag_interests")
        .insert(tags.map((tag) => ({ application_id: application.id, tag_id: tag.id })));

      if (tagInsertError) {
        return {
          status: "error",
          message: tagInsertError.message,
        };
      }
    }
  }

  return {
    status: "success",
    message:
      "Your application has been submitted. PATNA can now review it in Supabase and move it into the interview or invite workflow.",
  };
}
