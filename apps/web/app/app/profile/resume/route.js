import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { createResumeSignedUrl, resolveResumeAsset } from "@/lib/member-resumes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserContext } from "@/lib/supabase/access";

export async function GET() {
  const { supabase, user } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    return NextResponse.redirect(new URL("/auth/login?next=/app/profile", getSiteUrl()));
  }

  const { data: cohortProfile } = await supabase
    .from("cohort_member_profiles")
    .select("cv_url, raw_responses")
    .eq("user_id", user.id)
    .maybeSingle();
  const resumeAsset = resolveResumeAsset(cohortProfile?.cv_url, cohortProfile?.raw_responses);

  if (resumeAsset.source_kind === "none") {
    return new NextResponse("Resume not found.", { status: 404 });
  }

  if (resumeAsset.source_kind === "external") {
    return NextResponse.redirect(resumeAsset.original_url || resumeAsset.display_url);
  }

  const adminClient = createSupabaseAdminClient();
  const signedUrl = await createResumeSignedUrl({
    adminSupabase: adminClient,
    storagePath: resumeAsset.storage_path,
  });

  return NextResponse.redirect(signedUrl);
}
