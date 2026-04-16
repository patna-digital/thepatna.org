import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildAccessContext,
  buildSuggestedPrompts,
  buildWelcomeMessage,
  resolveAssistantAccessScope,
} from "@/lib/assistant";

async function listAccessibleExternalSources(accessScope) {
  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data: sources, error: sourceError } = await adminSupabase
      .from("assistant_external_sources")
      .select("id, title, visibility")
      .order("created_at", { ascending: false });

    if (sourceError || !sources?.length) {
      if (sourceError) {
        console.error("Failed to load assistant external sources:", sourceError);
      }
      return [];
    }

    const sourceIds = sources.map((source) => source.id);
    const { data: docs, error: docError } = await adminSupabase
      .from("assistant_external_documents")
      .select("source_id, status")
      .in("source_id", sourceIds);

    if (docError) {
      console.error("Failed to load assistant external document counts:", docError);
      return [];
    }

    const indexedCounts = {};
    for (const doc of docs || []) {
      if (doc.status !== "indexed") {
        continue;
      }

      indexedCounts[doc.source_id] = (indexedCounts[doc.source_id] || 0) + 1;
    }

    return (sources || [])
      .filter((source) => {
        if ((indexedCounts[source.id] || 0) <= 0) {
          return false;
        }

        if (source.visibility === "admin_only") {
          return accessScope.canReadAdminContent;
        }

        return accessScope.canReadMemberContent;
      })
      .map((source) => ({
        id: source.id,
        indexedCount: indexedCounts[source.id] || 0,
        title: source.title,
        visibility: source.visibility,
      }));
  } catch (error) {
    console.error("Failed to resolve assistant external source access:", error);
    return [];
  }
}

export async function GET() {
  const { user, profile, supabase, isAdmin } = await getCurrentUserContext({
    includeProfile: true,
    includeRoles: true,
  });

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessScope = await resolveAssistantAccessScope({
    isAdmin,
    supabase,
    userId: user.id,
  });
  accessScope.externalSources = await listAccessibleExternalSources(accessScope);

  return NextResponse.json({
    accessContext: buildAccessContext(accessScope),
    isAdmin: accessScope.canReadAdminContent,
    suggestedPrompts: buildSuggestedPrompts(accessScope),
    welcomeMessage: buildWelcomeMessage(accessScope, profile),
  });
}
