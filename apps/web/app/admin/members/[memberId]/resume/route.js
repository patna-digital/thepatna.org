import { NextResponse } from "next/server";
import { createResumeSignedUrl, resolveResumeAsset } from "@/lib/member-resumes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

export async function GET(_request, { params }) {
  const { supabase } = await requireAdminContext();
  const { memberId } = await params;
  const { data: cohortProfile } = await supabase
    .from("cohort_member_profiles")
    .select("cv_url, raw_responses")
    .eq("user_id", memberId)
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
