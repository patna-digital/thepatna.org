import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DailyLogMorningForm } from "@/components/daily-log-morning-form";
import { DailyLogEveningForm } from "@/components/daily-log-evening-form";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import { fetchLineManagerName, fetchTodayLogForUser } from "@/lib/daily-work-logs";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { requireStaffContext } from "@/lib/supabase/access";
import { submitEveningCheckOutAction, submitMorningCheckInAction } from "./actions";

function formatLogDate(logDate) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${logDate}T00:00:00.000Z`));
}

export default async function DailyLogPage({ searchParams }) {
  const t = await getTranslations();
  const { user, supabase, profile } = await requireStaffContext();

  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const requestedView = typeof resolvedSearchParams?.view === "string" ? resolvedSearchParams.view : "";

  const [frameData, todayResult, lineManagerName] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    fetchTodayLogForUser({ supabase, userId: user.id }),
    fetchLineManagerName({ supabase, lineManagerId: profile?.line_manager_id }),
  ]);

  const sidebarUser = frameData.sidebarUser || null;
  const { log, logDate } = todayResult;

  if (!profile?.line_manager_id) {
    return (
      <MemberWorkspaceShell
        eyebrow={t("appDailyLog.eyebrow")}
        notificationUserId={user?.id ?? null}
        sidebarUser={sidebarUser}
        subtitle={t("appDailyLog.subtitle")}
        title={t("appDailyLog.title")}
      >
        <p className="form-error">{t("appDailyLog.lineManagerMissing")}</p>
      </MemberWorkspaceShell>
    );
  }

  const hasCheckedIn = Boolean(log?.hasCheckedIn);
  const hasCheckedOut = Boolean(log?.hasCheckedOut);
  const defaultView = !hasCheckedIn ? "morning" : !hasCheckedOut ? "evening" : "summary";
  const view = ["morning", "evening", "summary"].includes(requestedView) ? requestedView : defaultView;

  const personnelDetails = [
    { label: t("appDailyLog.fieldName"), value: [profile.first_name, profile.surname].filter(Boolean).join(" ") || "—" },
    { label: t("appDailyLog.fieldRole"), value: profile.role_title || "—" },
    { label: t("appDailyLog.fieldCountry"), value: profile.country_of_residence || "—" },
    { label: t("appDailyLog.fieldTimezone"), value: profile.timezone || "—" },
    { label: t("appDailyLog.fieldLineManager"), value: lineManagerName || "—" },
    { label: t("appDailyLog.fieldDate"), value: formatLogDate(logDate) },
  ];

  return (
    <MemberWorkspaceShell
      eyebrow={t("appDailyLog.eyebrow")}
      notificationUserId={user?.id ?? null}
      sidebarUser={sidebarUser}
      subtitle={t("appDailyLog.subtitle")}
      title={t("appDailyLog.title")}
    >
      {notice === "checkin-saved" ? <p className="form-success">{t("appDailyLog.checkinSaved")}</p> : null}
      {notice === "checkout-saved" ? <p className="form-success">{t("appDailyLog.checkoutSaved")}</p> : null}
      {notice === "missing-fields" ? <p className="form-error">{t("appDailyLog.missingFields")}</p> : null}
      {notice === "error" ? <p className="form-error">{t("appDailyLog.submitError")}</p> : null}

      <div className="dashboard-card">
        <h3>{t("appDailyLog.personnelDetailsTitle")}</h3>
        <div className="two-column-grid">
          {personnelDetails.map((item) => (
            <div key={item.label}>
              <span className="member-profile-field-label">{item.label}</span>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="form-action-row">
        <Link className={view === "morning" ? "primary-button" : "secondary-button"} href="/app/daily-log?view=morning">
          {t("appDailyLog.tabMorning")}
        </Link>
        <Link className={view === "evening" ? "primary-button" : "secondary-button"} href="/app/daily-log?view=evening">
          {t("appDailyLog.tabEvening")}
        </Link>
        {hasCheckedIn || hasCheckedOut ? (
          <Link className={view === "summary" ? "primary-button" : "secondary-button"} href="/app/daily-log?view=summary">
            {t("appDailyLog.tabSummary")}
          </Link>
        ) : null}
      </div>

      {view === "morning" ? (
        <DailyLogMorningForm action={submitMorningCheckInAction} log={log} />
      ) : null}

      {view === "evening" ? (
        <DailyLogEveningForm action={submitEveningCheckOutAction} log={log} />
      ) : null}

      {view === "summary" && log ? (
        <div className="dashboard-card">
          <h3>{t("appDailyLog.summaryTitle")}</h3>
          <div className="two-column-grid">
            <div>
              <span className="member-profile-field-label">{t("appDailyLog.checkinTime")}</span>
              <p>{log.checkin_time || "—"}</p>
            </div>
            <div>
              <span className="member-profile-field-label">{t("appDailyLog.checkoutTime")}</span>
              <p>{log.checkout_time || "—"}</p>
            </div>
          </div>
          <p>{log.work_completed || ""}</p>
        </div>
      ) : null}
    </MemberWorkspaceShell>
  );
}
