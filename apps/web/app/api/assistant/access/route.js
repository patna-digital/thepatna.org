import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/supabase/access";
import {
  buildAccessContext,
  buildSuggestedPrompts,
  buildWelcomeMessage,
  resolveAccessibleExternalSources,
  resolveAssistantAccessScope,
} from "@/lib/assistant";

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
  accessScope.externalSources = await resolveAccessibleExternalSources(accessScope, supabase);
  const accessContext = buildAccessContext(accessScope);

  return NextResponse.json({
    blockedScopes: accessContext.blocked,
    isAdmin: accessScope.canReadAdminContent,
    scopes: accessContext.scopes,
    suggestedPrompts: buildSuggestedPrompts(accessScope),
    welcomeMessage: buildWelcomeMessage(accessScope, profile),
  });
}
