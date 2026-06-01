import { NextResponse } from "next/server";
import {
  createComplianceDocumentSignedUrl,
  resolveCodeOfConductAsset,
} from "@/lib/member-compliance-documents";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

export async function GET(_request, { params }) {
  const { supabase } = await requireAdminContext();
  const { memberId } = await params;
  const { data: cohortProfile } = await supabase
    .from("cohort_member_profiles")
    .select("code_of_conduct_url, raw_responses")
    .eq("user_id", memberId)
    .maybeSingle();
  const codeOfConductAsset = resolveCodeOfConductAsset(
    cohortProfile?.code_of_conduct_url,
    cohortProfile?.raw_responses,
  );

  if (codeOfConductAsset.source_kind === "none") {
    return new NextResponse("Code of Conduct not found.", { status: 404 });
  }

  if (codeOfConductAsset.source_kind === "external") {
    return NextResponse.redirect(codeOfConductAsset.original_url || codeOfConductAsset.display_url);
  }

  const adminClient = createSupabaseAdminClient();
  const signedUrl = await createComplianceDocumentSignedUrl({
    adminSupabase: adminClient,
    storagePath: codeOfConductAsset.storage_path,
  });

  return NextResponse.redirect(signedUrl);
}
