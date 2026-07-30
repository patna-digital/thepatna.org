import { getTranslations } from "next-intl/server";
import { ChoiceCard, ChoiceFieldset, Field } from "@/components/member-profile-fields";

export async function DailyLogMorningForm({ action, log }) {
  const t = await getTranslations();

  return (
    <form action={action} className="form-card stack">
      <div className="two-column-grid">
        <Field label={t("appDailyLog.checkinTimeLabel")}>
          <input defaultValue={log?.checkin_time || ""} name="checkin_time" required type="time" />
        </Field>
      </div>

      <Field label={t("appDailyLog.priority1Label")}>
        <input
          defaultValue={log?.priority_1 || ""}
          name="priority_1"
          placeholder={t("appDailyLog.priorityPlaceholder")}
          required
        />
      </Field>
      <Field label={t("appDailyLog.priority2Label")}>
        <input defaultValue={log?.priority_2 || ""} name="priority_2" placeholder={t("appDailyLog.priorityPlaceholder")} />
      </Field>
      <Field label={t("appDailyLog.priority3Label")}>
        <input defaultValue={log?.priority_3 || ""} name="priority_3" placeholder={t("appDailyLog.priorityPlaceholder")} />
      </Field>

      <Field label={t("appDailyLog.meetingsLabel")}>
        <textarea
          defaultValue={log?.meetings_planned || ""}
          name="meetings_planned"
          placeholder={t("appDailyLog.meetingsPlaceholder")}
        />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.availabilityLegend")}>
        <ChoiceCard
          defaultChecked={(log?.availability_today || "normal") === "normal"}
          label={t("appDailyLog.availabilityNormal")}
          name="availability_today"
          type="radio"
          value="normal"
        />
        <ChoiceCard
          defaultChecked={log?.availability_today === "different"}
          label={t("appDailyLog.availabilityDifferent")}
          name="availability_today"
          type="radio"
          value="different"
        />
      </ChoiceFieldset>
      <Field help={t("appDailyLog.availabilityNoteHelp")} label={t("appDailyLog.availabilityNoteLabel")}>
        <input defaultValue={log?.availability_note || ""} name="availability_note" />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.supportLegend")}>
        <ChoiceCard defaultChecked={log?.support_required === false} label={t("appDailyLog.no")} name="support_required" type="radio" value="no" />
        <ChoiceCard defaultChecked={log?.support_required === true} label={t("appDailyLog.yes")} name="support_required" type="radio" value="yes" />
      </ChoiceFieldset>
      <Field label={t("appDailyLog.supportDetailsLabel")}>
        <textarea defaultValue={log?.support_details || ""} name="support_details" />
      </Field>

      <ChoiceFieldset legend={t("appDailyLog.risksLegend")}>
        <ChoiceCard defaultChecked={log?.risks_blockers === false} label={t("appDailyLog.none")} name="risks_blockers" type="radio" value="no" />
        <ChoiceCard defaultChecked={log?.risks_blockers === true} label={t("appDailyLog.yes")} name="risks_blockers" type="radio" value="yes" />
      </ChoiceFieldset>
      <Field label={t("appDailyLog.risksDetailsLabel")}>
        <textarea defaultValue={log?.risks_details || ""} name="risks_details" />
      </Field>

      <div className="form-action-row">
        <button className="primary-button" type="submit">
          {t("appDailyLog.submitMorning")}
        </button>
      </div>
    </form>
  );
}
