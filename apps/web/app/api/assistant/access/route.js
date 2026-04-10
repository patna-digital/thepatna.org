import { NextResponse } from "next/server";
import { getCurrentUserContext } from "@/lib/supabase/access";
import {
  buildAccessContext,
  buildSuggestedPrompts,
  buildWelcomeMessage,
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

  return NextResponse.json({
    accessContext: buildAccessContext(accessScope),
    isAdmin: accessScope.canReadAdminContent,
    suggestedPrompts: buildSuggestedPrompts(accessScope),
    welcomeMessage: buildWelcomeMessage(accessScope, profile),
  });
}
