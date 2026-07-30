import { getTranslations } from "next-intl/server";
import { ChoiceCard, ChoiceFieldset, Field } from "@/components/member-profile-fields";
import { PRIORITIES_PROGRESS_OPTIONS, PROJECT_WORKED_ON_OPTIONS, WELLBEING_OPTIONS } from "@/lib/daily-work-log-options";

export async function DailyLogEveningForm({ action, log }) {
  const t = await getTranslations();
  const morningPriorities = [log?.priority_1, log?.priority_2, log?.priority_3].filter(Boolean);
  const selectedProjects = log?.projects_worked_on || [];

  return (
    <form action={action} className="form-card stack">
      {morningPriorities.length ? (
        <div className="field-summary-card">
          <strong>{t("appDailyLog.morningRecapTitle")}</strong>
          <p>{morningPriorities.join(" · ")}</p>
        </div>
      ) : null}

      <div className="two-column-grid">
        <Field label={t("appDailyLog.checkoutTimeLabel")}>
          <input defaultValue={log?.checkout_time || ""} name="checkout_time" required type="time" />
        </Field>
      </div>

      <Field label={t("appDailyLog.workCompletedLabel")}>
        <textarea
          defaultValue={log?.work_completed || ""}
          name="work_completed"
          placeholder={t("appDailyLog.workCompletedPlaceholder")}
          required
        />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.prioritiesProgressLegend")}>
        {PRIORITIES_PROGRESS_OPTIONS.map((option) => (
          <ChoiceCard
            defaultChecked={log?.priorities_progress === option.value}
            key={option.value}
            label={option.label}
            name="priorities_progress"
            type="radio"
            value={option.value}
          />
        ))}
      </ChoiceFieldset>
      <Field label={t("appDailyLog.prioritiesProgressCommentLabel")}>
        <input defaultValue={log?.priorities_progress_comment || ""} name="priorities_progress_comment" />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.projectsLegend")}>
        {PROJECT_WORKED_ON_OPTIONS.map((project) => (
          <ChoiceCard
            defaultChecked={selectedProjects.includes(project)}
            key={project}
            label={project}
            name="projects_worked_on"
            value={project}
          />
        ))}
      </ChoiceFieldset>
      <Field label={t("appDailyLog.projectsOtherLabel")}>
        <input defaultValue={log?.projects_worked_on_other || ""} name="projects_worked_on_other" />
      </Field>

      <Field label={t("appDailyLog.outstandingActionsLabel")}>
        <textarea defaultValue={log?.outstanding_actions || ""} name="outstanding_actions" />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.issuesLegend")}>
        <ChoiceCard defaultChecked={log?.issues_encountered === false} label={t("appDailyLog.no")} name="issues_encountered" type="radio" value="no" />
        <ChoiceCard defaultChecked={log?.issues_encountered === true} label={t("appDailyLog.yes")} name="issues_encountered" type="radio" value="yes" />
      </ChoiceFieldset>
      <Field label={t("appDailyLog.issuesDetailsLabel")}>
        <textarea defaultValue={log?.issues_details || ""} name="issues_details" />
      </Field>

      <Field label={t("appDailyLog.tomorrowPrioritiesLabel")}>
        <textarea defaultValue={log?.tomorrow_priorities || ""} name="tomorrow_priorities" />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.wellbeingLegend")}>
        {WELLBEING_OPTIONS.map((option) => (
          <ChoiceCard
            defaultChecked={log?.wellbeing === option.value}
            key={option.value}
            label={option.label}
            name="wellbeing"
            type="radio"
            value={option.value}
          />
        ))}
      </ChoiceFieldset>
      <Field label={t("appDailyLog.wellbeingCommentLabel")}>
        <input defaultValue={log?.wellbeing_comment || ""} name="wellbeing_comment" />
      </Field>

      <div className="form-action-row">
        <button className="primary-button" type="submit">
          {t("appDailyLog.submitEvening")}
        </button>
      </div>
    </form>
  );
}
