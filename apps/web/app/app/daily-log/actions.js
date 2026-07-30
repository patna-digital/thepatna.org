"use server";

import { redirect } from "next/navigation";
import {
  VALID_AVAILABILITY_TODAY_VALUES,
  VALID_PRIORITIES_PROGRESS_VALUES,
  VALID_WELLBEING_VALUES,
} from "@/lib/daily-work-log-options";
import { requireStaffContext } from "@/lib/supabase/access";

function parseOptionalText(formData, key) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function parseYesNo(formData, key) {
  const value = String(formData.get(key) || "").trim();

  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return null;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function submitMorningCheckInAction(formData) {
  const { supabase, user } = await requireStaffContext();

  const checkinTime = parseOptionalText(formData, "checkin_time");
  const priority1 = parseOptionalText(formData, "priority_1");
  const availabilityToday = parseOptionalText(formData, "availability_today");
  const supportRequired = parseYesNo(formData, "support_required");
  const risksBlockers = parseYesNo(formData, "risks_blockers");

  if (
    !checkinTime ||
    !priority1 ||
    !VALID_AVAILABILITY_TODAY_VALUES.includes(availabilityToday) ||
    supportRequired === null ||
    risksBlockers === null
  ) {
    redirect("/app/daily-log?view=morning&notice=missing-fields");
  }

  const logDate = todayIsoDate();

  const { error } = await supabase.from("daily_work_logs").upsert(
    {
      user_id: user.id,
      log_date: logDate,
      checkin_time: checkinTime,
      priority_1: priority1,
      priority_2: parseOptionalText(formData, "priority_2"),
      priority_3: parseOptionalText(formData, "priority_3"),
      meetings_planned: parseOptionalText(formData, "meetings_planned"),
      availability_today: availabilityToday,
      availability_note: parseOptionalText(formData, "availability_note"),
      support_required: supportRequired,
      support_details: parseOptionalText(formData, "support_details"),
      risks_blockers: risksBlockers,
      risks_details: parseOptionalText(formData, "risks_details"),
      checkin_submitted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) {
    redirect("/app/daily-log?view=morning&notice=error");
  }

  redirect("/app/daily-log?view=evening&notice=checkin-saved");
}

export async function submitEveningCheckOutAction(formData) {
  const { supabase, user } = await requireStaffContext();

  const checkoutTime = parseOptionalText(formData, "checkout_time");
  const workCompleted = parseOptionalText(formData, "work_completed");
  const prioritiesProgress = parseOptionalText(formData, "priorities_progress");
  const issuesEncountered = parseYesNo(formData, "issues_encountered");
  const wellbeing = parseOptionalText(formData, "wellbeing");
  const projectsWorkedOn = formData.getAll("projects_worked_on").map((value) => String(value || "").trim()).filter(Boolean);

  if (
    !checkoutTime ||
    !workCompleted ||
    !VALID_PRIORITIES_PROGRESS_VALUES.includes(prioritiesProgress) ||
    issuesEncountered === null ||
    !VALID_WELLBEING_VALUES.includes(wellbeing)
  ) {
    redirect("/app/daily-log?view=evening&notice=missing-fields");
  }

  const logDate = todayIsoDate();

  const { error } = await supabase.from("daily_work_logs").upsert(
    {
      user_id: user.id,
      log_date: logDate,
      checkout_time: checkoutTime,
      work_completed: workCompleted,
      priorities_progress: prioritiesProgress,
      priorities_progress_comment: parseOptionalText(formData, "priorities_progress_comment"),
      projects_worked_on: projectsWorkedOn,
      projects_worked_on_other: parseOptionalText(formData, "projects_worked_on_other"),
      outstanding_actions: parseOptionalText(formData, "outstanding_actions"),
      issues_encountered: issuesEncountered,
      issues_details: parseOptionalText(formData, "issues_details"),
      tomorrow_priorities: parseOptionalText(formData, "tomorrow_priorities"),
      wellbeing,
      wellbeing_comment: parseOptionalText(formData, "wellbeing_comment"),
      checkout_submitted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" },
  );

  if (error) {
    redirect("/app/daily-log?view=evening&notice=error");
  }

  redirect("/app/daily-log?view=summary&notice=checkout-saved");
}
