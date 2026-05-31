import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSelector } from "@/components/language-selector";
import { MemberWorkspaceShell } from "@/components/member-workspace-shell";
import {
  formatProfileAvailabilityStatus,
  formatProfileVisibilitySetting,
  PROFILE_AVAILABILITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
} from "@/lib/profile-form-options";
import { getCurrentUserContext } from "@/lib/supabase/access";
import { fetchMemberWorkspaceFrameData } from "@/lib/member-workspace";
import { SettingsCard } from "./components/settings-card";
import { SettingsSelect } from "./components/settings-select";
import { NotificationPreferencesCard } from "./components/notification-preferences-card";
import {
  updateVisibilitySettingAction,
  updateAvailabilityStatusAction,
  updateTimezoneAction,
  requestPasswordResetAction,
  updateNotificationPreferenceAction,
  updateDigestFrequencyAction,
} from "./actions";
import { getOrCreatePreferences } from "@/lib/notifications";

// Timezone options (common timezones)
const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Athens", label: "Athens (EET)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Africa/Nairobi", label: "Nairobi (EAT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "America/Denver", label: "Denver (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
];

function formatDate(value) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function SettingsPage({ searchParams }) {
  const { user, supabase } = await getCurrentUserContext({
    includeProfile: false,
    includeRoles: false,
  });

  if (!user || !supabase) {
    redirect("/auth/login?next=/app/settings");
  }

  const [frameData, notifPrefs] = await Promise.all([
    fetchMemberWorkspaceFrameData({ supabase, userId: user.id }),
    getOrCreatePreferences(supabase, user.id),
  ]);

  // Allow navigation even with incomplete profile
  const member = frameData.member || {};
  const sidebarUser = frameData.sidebarUser || null;

  const resolvedSearchParams = await searchParams;
  const notice = typeof resolvedSearchParams?.notice === "string" ? resolvedSearchParams.notice : "";
  const noticeType = typeof resolvedSearchParams?.type === "string" ? resolvedSearchParams.type : "success";

  return (
    <MemberWorkspaceShell
      eyebrow="Workspace"
      notificationUserId={user.id}
      sidebarUser={sidebarUser}
      subtitle="Manage your profile visibility, availability, and account preferences. Changes are saved immediately."
      title="Settings"
    >
      <div className="member-dashboard-stack">
        {/* Quick Actions Bar */}
        <div className="settings-quick-actions">
          <Link className="secondary-button" href="/app/profile">
            <span>✎</span> Edit full profile
          </Link>
          <Link className="secondary-button" href="/app/members">
            <span>👤</span> View in directory
          </Link>
        </div>

        {/* Notice Messages */}
        {notice && (
          <div className={`settings-notice ${noticeType === "error" ? "settings-notice-error" : ""}`}>
            {notice === "visibility-updated" && "Visibility setting saved successfully."}
            {notice === "availability-updated" && "Availability status saved successfully."}
            {notice === "timezone-updated" && "Timezone saved successfully."}
            {notice === "password-reset-sent" && "Password reset email sent. Check your inbox."}
            {noticeType === "error" && notice}
          </div>
        )}

        {/* Primary Settings Grid */}
        <div className="settings-grid-primary">
          {/* Visibility Card */}
          <SettingsCard
            description="Control who can see your profile in the PATNA directory"
            title="Directory visibility"
          >
            <SettingsSelect
              action={updateVisibilitySettingAction}
              currentValue={member.visibility_setting || "members_only"}
              name="visibility_setting"
              options={PROFILE_VISIBILITY_OPTIONS}
            />
            <div className="settings-card-footer">
              <span className={`status-chip ${member.visibility_setting === "hidden" ? "chip-muted" : "chip-neutral"}`}>
                {formatProfileVisibilitySetting(member.visibility_setting)}
              </span>
            </div>
          </SettingsCard>

          {/* Availability Card */}
          <SettingsCard
            description="Let other members know your current availability for collaboration"
            title="Availability status"
          >
            <SettingsSelect
              action={updateAvailabilityStatusAction}
              currentValue={member.availability_status || "available"}
              name="availability_status"
              options={PROFILE_AVAILABILITY_OPTIONS}
            />
            <div className="settings-card-footer">
              <span className={`status-chip ${
                member.availability_status === "available" ? "chip-success" : 
                "chip-muted"
              }`}>
                {formatProfileAvailabilityStatus(member.availability_status)}
              </span>
            </div>
          </SettingsCard>
        </div>

        {/* Secondary Settings */}
        <div className="settings-grid-secondary">
          {/* Language */}
          <SettingsCard
            description="Choose the language for your PATNA workspace"
            title="Language"
          >
            <LanguageSelector variant="full" />
          </SettingsCard>

          {/* Timezone */}
          <SettingsCard
            description="Your local timezone for meeting scheduling"
            title="Timezone"
          >
            <SettingsSelect
              action={updateTimezoneAction}
              currentValue={member.timezone || "UTC"}
              name="timezone"
              options={TIMEZONE_OPTIONS}
            />
          </SettingsCard>

          {/* Account State */}
          <SettingsCard
            description="Your current PATNA membership status"
            title="Account status"
          >
            <div className="settings-readonly-list">
              <div className="settings-readonly-item">
                <span className="settings-readonly-label">Onboarding</span>
                <span className={`status-chip ${
                  member.onboarding_status === "active" ? "chip-success" : "chip-warning"
                }`}>
                  {member.onboarding_status || "Pending"}
                </span>
              </div>
              <div className="settings-readonly-item">
                <span className="settings-readonly-label">Profile</span>
                <span className={`status-chip ${
                  member.profileStatus === "active" ? "chip-success" : "chip-danger"
                }`}>
                  {member.profileStatus || "Pending"}
                </span>
              </div>
              {member.onboarding_completed_at && (
                <div className="settings-readonly-item">
                  <span className="settings-readonly-label">Member since</span>
                  <span className="settings-readonly-value">
                    {formatDate(member.onboarding_completed_at)}
                  </span>
                </div>
              )}
            </div>
          </SettingsCard>
        </div>

        {/* Account Information */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account information</h2>
          <div className="card-grid member-settings-grid">
            <article className="dashboard-card member-setting-card">
              <h3>Community context</h3>
              <p>Your role and cohort placement within PATNA.</p>
              <div className="member-setting-list">
                <div className="settings-info-row">
                  <span className="settings-info-label">Role</span>
                  <span className="settings-info-value">{member.role_title || "Not specified"}</span>
                </div>
                <div className="settings-info-row">
                  <span className="settings-info-label">Organisation</span>
                  <span className="settings-info-value">{member.organisation_name || "Not specified"}</span>
                </div>
                <div className="settings-info-row">
                  <span className="settings-info-label">Primary cohort</span>
                  <span className="settings-info-value">{member.primaryCohort?.name || "Not assigned"}</span>
                </div>
                <div className="settings-info-row">
                  <span className="settings-info-label">Email</span>
                  <span className="settings-info-value">{member.email}</span>
                </div>
              </div>
            </article>

            {/* Security */}
            <article className="dashboard-card member-setting-card">
              <h3>Security</h3>
              <p>Manage your account security and access.</p>
              <div className="settings-actions-stack">
                <form action={requestPasswordResetAction}>
                  <button className="secondary-button settings-action-button" type="submit">
                    <span>🔐</span> Reset password
                  </button>
                </form>
                <p className="settings-action-hint">
                  We&apos;ll send a password reset link to your email.
                </p>
              </div>
            </article>

            {/* Notification Preferences */}
            <NotificationPreferencesCard
              preferences={notifPrefs}
              updateDigestFrequencyAction={updateDigestFrequencyAction}
              updatePreferenceAction={updateNotificationPreferenceAction}
            />
          </div>
        </section>
      </div>
    </MemberWorkspaceShell>
  );
}
