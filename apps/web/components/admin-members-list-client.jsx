"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MemberProfileModal } from "./member-profile-modal";

// ─── Column config ────────────────────────────────────────────────────────────

const STORAGE_KEY = "patna-admin-member-cols-v2";

const COLUMN_GROUPS = [
  {
    label: "Row details",
    hint: "What appears beneath the member name",
    columns: [
      { key: "cohort",       label: "Cohort" },
      { key: "organisation", label: "Organisation" },
      { key: "country",      label: "Country" },
    ],
  },
  {
    label: "Status indicators",
    hint: "Chips shown to the right of each name",
    columns: [
      { key: "invite",     label: "Invite status" },
      { key: "onboarding", label: "Onboarding" },
      { key: "profile",    label: "Profile status" },
      { key: "completion", label: "Completion %" },
    ],
  },
  {
    label: "Metadata",
    hint: "Small details shown below the row",
    columns: [
      { key: "email",  label: "Email address" },
      { key: "signin", label: "Last sign-in" },
    ],
  },
];

const DEFAULT_COLS = {
  cohort: true,
  organisation: false,
  country: false,
  invite: true,
  onboarding: false,
  profile: false,
  completion: true,
  email: true,
  signin: false,
};

function loadCols() {
  if (typeof window === "undefined") return DEFAULT_COLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_COLS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_COLS;
}

function saveCols(cols) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); } catch {}
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatLabel(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function completionTone(pct) {
  if (pct >= 70) return "success";
  if (pct >= 30) return "warning";
  return "danger";
}

function getIssues(member) {
  const issues = [];
  if (member.needsHeadshotRecovery) issues.push("Headshot recovery needed");
  if (member.needsResumeRecovery) issues.push("Resume recovery needed");
  if (!member.isProfileComplete && member.missingProfileFields?.length)
    issues.push(`Missing: ${member.missingProfileFields.join(", ")}`);
  return issues;
}

function inviteLabel(member) {
  if (!member.wasContacted) return "Not invited";
  const method = member.latestInvite?.delivery_method;
  return method === "supabase_invite" ? "Invite sent" : "Reset sent";
}

function inviteTone(member) {
  return member.wasContacted ? "neutral" : "muted";
}

function getSearchText(member) {
  return [
    member.displayName, member.email, member.organisation_name,
    member.role_title, member.country_of_residence,
    member.primaryCohort?.name,
    ...(member.secondaryCohorts || []).map((c) => c.name),
    ...(member.domainTags || []).map((t) => t.name),
  ].filter(Boolean).join(" ").toLowerCase();
}

// ─── Column picker ────────────────────────────────────────────────────────────

function ColumnPicker({ cols, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const activeCount = Object.values(cols).filter(Boolean).length;
  const allKeys = COLUMN_GROUPS.flatMap((g) => g.columns.map((c) => c.key));

  return (
    <div className="col-picker" ref={ref}>
      <button
        className={`secondary-button col-picker-btn${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="col-picker-icon" aria-hidden="true">⊞</span>
        Columns
        <span className="col-picker-badge">{activeCount}/{allKeys.length}</span>
      </button>

      {open ? (
        <div className="col-picker-panel">
          <div className="col-picker-header">
            <span>Visible columns</span>
            <button
              className="col-picker-reset"
              onClick={() => {
                const reset = Object.fromEntries(allKeys.map((k) => [k, DEFAULT_COLS[k]]));
                onChange(reset);
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          {COLUMN_GROUPS.map((group) => (
            <div className="col-picker-group" key={group.label}>
              <p className="col-picker-group-label">{group.label}</p>
              <p className="col-picker-group-hint">{group.hint}</p>
              {group.columns.map((col) => (
                <label className="col-picker-item" key={col.key}>
                  <input
                    checked={!!cols[col.key]}
                    onChange={() => onChange({ ...cols, [col.key]: !cols[col.key] })}
                    type="checkbox"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Select-all ───────────────────────────────────────────────────────────────

function SelectAllCheckbox({ checkboxName, totalCount }) {
  const [state, setState] = useState("none");
  const ref = useRef(null);

  const sync = useCallback(() => {
    const all = document.querySelectorAll(`input[name="${checkboxName}"]`);
    const checked = document.querySelectorAll(`input[name="${checkboxName}"]:checked`);
    if (checked.length === 0) setState("none");
    else if (checked.length === all.length) setState("all");
    else setState("some");
  }, [checkboxName]);

  useEffect(() => {
    sync();
    const all = Array.from(document.querySelectorAll(`input[name="${checkboxName}"]`));
    all.forEach((cb) => cb.addEventListener("change", sync));
    return () => all.forEach((cb) => cb.removeEventListener("change", sync));
  }, [checkboxName, sync, totalCount]);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);

  function toggle() {
    const all = Array.from(document.querySelectorAll(`input[name="${checkboxName}"]`));
    const shouldCheck = state !== "all";
    all.forEach((cb) => {
      cb.checked = shouldCheck;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });
    setState(shouldCheck ? "all" : "none");
  }

  return (
    <label className="mem-select-all" title={state === "all" ? "Deselect all" : "Select all"}>
      <input checked={state === "all"} onChange={toggle} ref={ref} type="checkbox" />
      <span>{state === "all" ? `All ${totalCount} selected` : "Select all"}</span>
    </label>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member, cols, returnPath, sendInviteAction, updateStatusAction, onViewProfile }) {
  const issues = getIssues(member);
  const hasIssues = issues.length > 0;

  const subtitle = [
    cols.cohort && member.primaryCohort?.name,
    cols.organisation && member.organisation_name,
    cols.country && member.country_of_residence,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mem-wrap">
      <label className="mem-check">
        <input form="bulk-member-action-form" name="profile_ids" type="checkbox" value={member.id} />
      </label>

      <details className="mem-row">
        <summary className="mem-summary">
          <div className="mem-top">
            <div className="mem-id">
              <span className="mem-name">{member.displayName}</span>
              {subtitle ? <span className="mem-sub">{subtitle}</span> : null}
              {cols.email && member.email ? (
                <span className="mem-email">{member.email}</span>
              ) : null}
              {cols.signin && member.authUser?.last_sign_in_at ? (
                <span className="mem-signin">Sign-in: {formatDate(member.authUser.last_sign_in_at)}</span>
              ) : null}
            </div>

            <div className="mem-end">
              {cols.invite ? (
                <span className={`mem-chip mem-chip-${inviteTone(member)}`}>{inviteLabel(member)}</span>
              ) : null}
              {cols.onboarding ? (
                <span className={`mem-chip mem-chip-${member.isActive ? "success" : "muted"}`}>
                  {formatLabel(member.onboarding_status)}
                </span>
              ) : null}
              {cols.profile ? (
                <span className={`mem-chip mem-chip-${member.profileStatus === "inactive" ? "muted" : "success"}`}>
                  {member.profileStatus}
                </span>
              ) : null}
              {cols.completion ? (
                <span className={`mem-chip mem-chip-${completionTone(member.completionPercent)}`}>
                  {member.completionPercent}%
                </span>
              ) : null}
              {hasIssues ? (
                <span className="mem-alert-dot" title={issues.join(" · ")}>!</span>
              ) : null}
              <span className="mem-chevron" aria-hidden="true">›</span>
            </div>
          </div>
        </summary>

        <div className="mem-detail">
          {hasIssues ? (
            <div className="mem-notice mem-notice-warn">{issues.join(" · ")}</div>
          ) : (
            <div className="mem-notice">
              {member.isActive
                ? "Onboarding complete — member is ready for access management."
                : "Member will complete onboarding after setting a password."}
            </div>
          )}

          <div className="mem-detail-grid">
            <div className="mem-field">
              <span className="mem-field-label">Primary cohort</span>
              <span className="mem-field-value">{member.primaryCohort?.name || "Not assigned"}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Secondary cohorts</span>
              <span className="mem-field-value">
                {member.secondaryCohorts?.length
                  ? member.secondaryCohorts.map((c) => c.name).join(", ")
                  : "None"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Organisation</span>
              <span className="mem-field-value">{member.organisation_name || "—"}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Role</span>
              <span className="mem-field-value">{member.role_title || "—"}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Country</span>
              <span className="mem-field-value">{member.country_of_residence || "—"}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Phone / WhatsApp</span>
              <span className="mem-field-value">
                {[member.phone_number, member.whatsapp_number].filter(Boolean).join(" / ") || "—"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Timezone</span>
              <span className="mem-field-value">{member.timezone || "—"}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Availability</span>
              <span className="mem-field-value">{formatLabel(member.availabilityStatus)}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Email</span>
              <span className="mem-field-value">{member.email}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Last sign-in</span>
              <span className="mem-field-value">{formatDateTime(member.authUser?.last_sign_in_at)}</span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Last login email</span>
              <span className="mem-field-value">
                {member.latestInvite ? formatDateTime(member.latestInvite.created_at) : "Not sent yet"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Form completion</span>
              <span className="mem-field-value">
                {member.cohortProfile?.completed_at
                  ? `Completed ${formatDate(member.cohortProfile.completed_at)}`
                  : "Still required"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Headshot</span>
              <span className="mem-field-value">
                {member.needsHeadshotRecovery ? "Recovery needed" : member.hasHeadshot ? "Ready" : "Missing"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Resume</span>
              <span className="mem-field-value">
                {member.needsResumeRecovery
                  ? "Recovery needed"
                  : member.resumeAsset?.source_kind === "storage"
                    ? "Stored"
                    : member.resumeAsset?.source_kind === "external"
                      ? "External"
                      : "Missing"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Profile</span>
              <span className="mem-field-value">
                {member.completionPercent}% complete
                {member.profileStatus === "inactive" ? " · Inactive" : " · Active"}
              </span>
            </div>
            <div className="mem-field">
              <span className="mem-field-label">Migration batch</span>
              <span className="mem-field-value">{member.migration_batch_id || "Legacy / manual"}</span>
            </div>
          </div>

          <div className="mem-actions">
            <button className="secondary-button" onClick={() => onViewProfile(member)} type="button">
              View profile
            </button>
            <Link className="secondary-button" href={`/admin/members/${member.id}`}>
              {member.needsHeadshotRecovery ? "Recover headshot" : "Edit member"}
            </Link>
            <form action={updateStatusAction}>
              <input name="profile_id" type="hidden" value={member.id} />
              <input name="return_to" type="hidden" value={returnPath} />
              <input name="next_status" type="hidden" value={member.profileStatus === "inactive" ? "active" : "inactive"} />
              <button className="secondary-button" type="submit">
                Mark {member.profileStatus === "inactive" ? "active" : "inactive"}
              </button>
            </form>
            <form action={sendInviteAction}>
              <input name="profile_id" type="hidden" value={member.id} />
              <input name="return_to" type="hidden" value={returnPath} />
              <button className="primary-button" type="submit">
                {member.latestInvite ? "Resend login email" : "Send login email"}
              </button>
            </form>
          </div>
        </div>
      </details>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AdminMembersListClient({
  members,
  initialSearch = "",
  returnPath,
  sendInviteAction,
  updateStatusAction,
}) {
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [search, setSearch] = useState(initialSearch);
  const [selectedMember, setSelectedMember] = useState(null);

  // Hydrate from localStorage after mount
  useEffect(() => { setCols(loadCols()); }, []);

  function handleColChange(next) {
    setCols(next);
    saveCols(next);
  }

  const filtered = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => getSearchText(m).includes(q));
  })();

  if (!members.length) {
    return (
      <div className="mem-empty">
        <strong>No members found</strong>
        <p>No members match the current filter.</p>
      </div>
    );
  }

  return (
    <>
      {/* List header: select-all + count + column picker */}
      <div className="mem-list-header">
        <div className="mem-list-header-left">
          <SelectAllCheckbox checkboxName="profile_ids" totalCount={filtered.length} />
          <span className="mem-list-count">
            {filtered.length === members.length
              ? `${members.length} member${members.length === 1 ? "" : "s"}`
              : `${filtered.length} of ${members.length}`}
          </span>
        </div>
        <ColumnPicker cols={cols} onChange={handleColChange} />
      </div>

      {/* Inline quick-filter when server search isn't active */}
      {members.length > 10 && !initialSearch ? (
        <div className="mem-quick-search">
          <span className="mem-qs-icon" aria-hidden="true">⌕</span>
          <input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick filter within this view…"
            type="search"
            value={search}
          />
          {search ? (
            <button className="mem-qs-clear" onClick={() => setSearch("")} type="button">✕</button>
          ) : null}
        </div>
      ) : null}

      {/* List */}
      <article className="dashboard-card mem-list-card">
        {filtered.length ? (
          <div className="mem-list">
            {filtered.map((member) => (
              <MemberRow
                cols={cols}
                key={member.id}
                member={member}
                onViewProfile={setSelectedMember}
                returnPath={returnPath}
                sendInviteAction={sendInviteAction}
                updateStatusAction={updateStatusAction}
              />
            ))}
          </div>
        ) : (
          <div className="mem-empty">
            <strong>{search ? "No matches" : "No members found"}</strong>
            <p>{search ? "Try a different name, email, or organisation." : "No members match this filter."}</p>
          </div>
        )}
      </article>

      {selectedMember ? (
        <MemberProfileModal
          isAdmin={true}
          isSelf={false}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </>
  );
}
