import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberEventSubmissionForm } from "@/components/member-event-submission-form";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { submitMemberEventAction } from "../actions";

function buildDraftFromSearchParams(searchParams) {
  const dateParam = typeof searchParams?.date === "string" ? searchParams.date : "";
  const startsOn = typeof searchParams?.starts_on === "string" ? searchParams.starts_on : dateParam;
  const endsOn = typeof searchParams?.ends_on === "string" ? searchParams.ends_on : startsOn;

  return {
    title: typeof searchParams?.title === "string" ? searchParams.title : "",
    event_type: typeof searchParams?.event_type === "string" ? searchParams.event_type : "",
    location: typeof searchParams?.location === "string" ? searchParams.location : "",
    display_date: typeof searchParams?.display_date === "string" ? searchParams.display_date : "",
    starts_at: startsOn ? `${startsOn}T00:00:00.000Z` : null,
    ends_at: endsOn ? `${endsOn}T23:59:59.000Z` : null,
    summary: typeof searchParams?.summary === "string" ? searchParams.summary : "",
    body: "",
    patna_involvement: "",
    official_link: "",
    organising_institutions: [],
    themes: [],
  };
}

export default async function MemberEventSubmitPage({ searchParams }) {
  const t = await getTranslations();
  const { user, supabase, isAdmin } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: true,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/events/submit");
  }

  if (isAdmin) {
    redirect("/admin/events/new");
  }

  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const frameData = await fetchMemberWorkspaceFrameData({ supabase, userId: user.id });
  const sidebarUser = frameData.sidebarUser || null;
  const draft = buildDraftFromSearchParams(resolvedSearchParams || {});

  return (
    <MemberWorkspaceShell
      eyebrow={t("appEvents.eyebrow")}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle={t("appEvents.submitSubtitle")}
      title={t("appEvents.submitTitle")}
    >
      {notice === "missing" ? <p className="form-error">{t("appEvents.submitMissingFields")}</p> : null}
      {notice === "error" ? <p className="form-error">{t("appEvents.submitError")}</p> : null}
      <MemberEventSubmissionForm action={submitMemberEventAction} draft={draft} submitLabel={t("appEvents.submitForReview")} />
    </MemberWorkspaceShell>
  );
}
