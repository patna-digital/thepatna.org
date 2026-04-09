import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import {
  createComplianceDocumentSignedUrl,
  resolveCodeOfConductAsset,
} from "@/lib/member-compliance-documents";
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
    .select("code_of_conduct_url, raw_responses")
    .eq("user_id", user.id)
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
