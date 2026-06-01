import { NextResponse } from "next/server";
import {
  createComplianceDocumentSignedUrl,
  resolveNdaAsset,
} from "@/lib/member-compliance-documents";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

export async function GET(_request, { params }) {
  const { supabase } = await requireAdminContext();
  const { memberId } = await params;
  const { data: cohortProfile } = await supabase
    .from("cohort_member_profiles")
    .select("nda_url, raw_responses")
    .eq("user_id", memberId)
    .maybeSingle();
  const ndaAsset = resolveNdaAsset(cohortProfile?.nda_url, cohortProfile?.raw_responses);

  if (ndaAsset.source_kind === "none") {
    return new NextResponse("NDA not found.", { status: 404 });
  }

  if (ndaAsset.source_kind === "external") {
    return NextResponse.redirect(ndaAsset.original_url || ndaAsset.display_url);
  }

  const adminClient = createSupabaseAdminClient();
  const signedUrl = await createComplianceDocumentSignedUrl({
    adminSupabase: adminClient,
    storagePath: ndaAsset.storage_path,
  });

  return NextResponse.redirect(signedUrl);
}
