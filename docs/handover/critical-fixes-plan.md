# Fix Plan — Critical Gaps Found During Handover Review

This plan covers every gap flagged in [functionality-inventory.md](functionality-inventory.md) and [manual-processes.md](manual-processes.md). Each item has: what's wrong, why it matters, the proposed fix, effort, and — where relevant — a decision only PATNA can make (wording, policy) that the fix is blocked on. Ordered by priority.

**Updated** after fully documenting the other ten manual processes (see manual-processes.md) — several new issues surfaced during that pass and are folded in below (marked *new*). One of them (§0, lead handling) is arguably the single highest-risk item in this whole document.

Nothing here has been implemented yet — this is the plan to review and approve before I (or the incoming developer) start building.

---

## P0 — Fix before handover (real risk if left as-is)

### 1. NDA / Code of Conduct: no blank template exists in the platform, and signing isn't required to become active

**Problem:** The platform has a place to *upload a signed* NDA/Code of Conduct, but nothing that provides the *blank* document to sign in the first place, and a member can reach full "active" status without ever uploading either. If PATNA's actual policy requires these before someone is a full member, that policy isn't enforced anywhere — it depends entirely on an admin remembering to check.

**Why it matters:** This is a compliance/legal gap, not just a UX one. If PATNA has ever considered NDA/Code-of-Conduct signature mandatory, there may already be active members today who never signed one.

**Proposed fix (two parts):**
- **Part A — make the template available in-platform.** Once PATNA supplies the current blank NDA and Code of Conduct files, add them as downloadable assets and surface a "Download template" link next to the upload fields in the onboarding wizard (`apps/web/components/member-profile-fields.jsx`) and on the admin member detail page, so nobody has to go hunting for them by email. (Small, but blocked on PATNA providing the actual files — see "Needs your input" below.)
- **Part B — decide whether to make it a hard gate.** If yes, add `nda_file`/`code_of_conduct_file` (or their `_url` fallback) to the required fields for the "visibility-files" section in `apps/web/lib/profile-onboarding.js`, so `onboarding_status` can't flip to `active` without them.

**Needs your input before this can be built:**
- Send me (or point me to) the current blank NDA and Code of Conduct documents.
- Decide: should signing be a hard requirement to reach "active" status, or should it stay optional with admins following up manually? (Making it a hard gate adds friction for new members, so this is a real trade-off, not just an engineering toggle.)
- Decide whether any currently-active members need to be retroactively asked to sign.

**Effort:** Small once the above is decided (a few hours). Priority: high — recommend resolving the policy question even if the code change waits.

---

### 2. A member's own cohort choice silently overrides the cohort an admin assigned

**Problem:** During application review, an admin picks the cohort(s) a new member should belong to. But the onboarding wizard lets the member pick *any* cohort in the system from an open dropdown, and whatever they pick wins the moment they save that step — with no warning to the admin that their assignment was overridden.

**Why it matters:** Cohort membership likely drives what content/spaces/reporting a member is grouped under. Right now, admin cohort decisions can be silently undone by the member without anyone noticing.

**Proposed fix:** Constrain the onboarding wizard's cohort dropdown to only the cohort(s) an admin actually assigned to that person's application (`application_assigned_cohorts`), with a clear fallback (e.g., "None of these — contact an admin") if none were assigned, rather than showing every cohort in the system. Touches `apps/web/components/member-profile-fields.jsx` (dropdown options) and `apps/web/lib/member-profile-updates.js` (save logic).

**Needs your input:** Should a member ever be able to pick a cohort admins didn't assign (e.g. self-service switch), or should any change always go through an admin? This determines whether the fallback is "contact an admin" or "pick freely."

**Effort:** Medium (half a day, including testing the onboarding flow end-to-end afterward).

---

## P1 — Should fix before handover (low effort, clear value, code is largely ready)

### 3. Digest emails are fully built but never scheduled

**Problem:** `apps/web/app/api/notifications/digest/route.js` sends the daily/weekly activity digest members can opt into, and it's already protected by a cron secret — but `vercel.json` only schedules the calendar sync job. This endpoint has likely never fired in production.

**Proposed fix:** Add two entries to `vercel.json`'s `crons` list — one for `/api/notifications/digest?type=daily` (once a day) and one for `/api/notifications/digest?type=weekly` (once a week). No application code changes needed.

**Needs your input:** Confirm PATNA actually wants digest emails going out — if members opted in expecting them and never received one, turning this on is a quick win; if this feature was quietly shelved, better to say so now than leave it half-wired.

**Effort:** Small (under an hour, plus a test run).

---

### 4. Applicants get no confirmation email when they apply

**Problem:** The only acknowledgement a prospective member gets is an on-page message that disappears if they close the tab. Nothing lands in their inbox.

**Proposed fix:** Add an applicant-facing email template (following the existing branded style in `apps/web/lib/email/templates/`) and send it via the existing `sendEmail` helper (`apps/web/lib/email/resend.js`) right after the application is saved, in `apps/web/app/(marketing)/community/join/actions.js`.

**Needs your input:** Final copy — what to say about expected response time, next steps, etc. I can draft it for review.

**Effort:** Small (a couple of hours).

---

### 5. Applicants get no email when their status changes (interviewing / waitlisted / declined)

**Problem:** `reviewApplicationAction` changes the application's status but never notifies the applicant. Any interview invite, waitlist notice, or decline message today is sent by hand, outside the platform, by whoever's doing the review — which means it's inconsistent and depends on that person remembering.

**Proposed fix:** When `reviewApplicationAction` (`apps/web/app/admin/applications/actions.js`) changes status to `interviewing`, `waitlist`, or `declined`, automatically send the applicant a matching email. Three short templates needed (interview invite, waitlist notice, decline notice).

**Needs your input:** Final wording for all three — these are sensitive (especially the decline), so I'd want your sign-off on tone before wiring this up. Also confirm: should "declined" always get an email, or should some declines still be handled by hand (e.g. a personal note for certain applicants)? If PATNA wants case-by-case discretion for some outcomes, we should build an opt-out checkbox into the review form rather than making the email unconditional.

**Effort:** Medium (half a day — three templates plus the wiring and testing each transition).

---

## P2 — Configuration only, not a code change (do this in the Supabase dashboard, not the repo)

### 6. The invite/password-setup email is Supabase's generic default, not PATNA-branded

**Problem:** When someone's approved and invited, the email they get is Supabase's own default "you've been invited" template — plain, unbranded, and inconsistent with the other PATNA-branded emails in this codebase.

**Proposed fix:** This isn't a code change — it's a setting in the Supabase project dashboard (Authentication → Email Templates), for both the "Invite user" and "Reset password" templates. Recommend styling them to match the existing templates in `apps/web/lib/email/templates/` for consistency.

**Needs your input / access:** Whoever has Supabase project admin access needs to make this change, or grant the incoming developer access to do it.

**Effort:** Small, but it's a to-do for whoever holds Supabase dashboard access — flagging so it doesn't fall through the cracks in the handover.

---

## No action needed before handover (documented, not urgent)

### 7. Unused seeded roles: `cohort_lead`, `moderator`, `content_editor`

These exist in the database from early setup but aren't wired to any current screen or permission check. They're harmless as-is. Recommend the incoming developer simply knows they're dormant, rather than spending time removing them now — removing them is low-value and carries a small risk of breaking something not yet discovered. Revisit only if/when PATNA plans to actually use one of them.

---

---

## Addendum — additional issues found while documenting the other manual processes

Tracing the remaining ten manual processes (event moderation, lead handling, editorial workflow, offboarding, space approvals, broadcasts, staff monitoring, line-manager assignment, Assistant reindexing, featured-content curation — see manual-processes.md) turned up more gaps. Folding them in here, at the same priority scale as above.

### P0 — highest risk found in this whole review

**8. No admin is ever notified when a partnership, collaboration, or support-request enquiry comes in.**

**Problem:** The three public "Work with us" forms save straight into the database with zero email alert to anyone. The only signal is a small unread-count badge in the admin sidebar — visible only if an admin happens to be logged in and looking at it.

**Why it matters:** This is arguably worse than the applicant-email gaps above, because it's not a communication nicety — it's real business development (partnerships, funding collaborations, service requests) that can sit completely unseen indefinitely. If PATNA has been relying on staff remembering to check the admin panel, some enquiries may already have been missed.

**Proposed fix:** Send an email (same pattern as the existing "new application" admin alert — reuse `apps/web/lib/email/resend.js` + a new branded template) to relevant admins whenever a row is inserted into `partnership_leads`, `collaboration_leads`, or `service_requests`. Straightforward, low-risk — the application-notification flow is a working template to copy.

**Needs your input:** Who should receive each type of lead email (all admins, or a specific person per pipeline)?

**Effort:** Small–Medium (half a day, mirrors work already done for applications).

**Priority: fix this first**, ahead of even the NDA/cohort items above, given the potential real-world cost of a missed enquiry.

---

**9. The "Featured Partners" admin toggle appears to do nothing on the live site.**

**Problem:** Tracing the code, the homepage's partner-logo section is driven by a separate, hardcoded list in `apps/web/lib/patna-data.js` — not by the `partners` database table or the "featured" checkbox admins are shown in `/admin/website`. As far as the code shows, toggling this checkbox has no visible effect anywhere on the public site.

**Why it matters:** If true, this is a broken/incomplete feature that looks functional to an admin but silently does nothing — worse than not having the feature at all, since it creates false confidence that the homepage reflects what was toggled.

**Proposed fix:** First, verify against the live site whether this is really dead (a quick manual check: toggle a partner, look at the homepage). If confirmed dead, either (a) wire the homepage partner section to actually read `is_featured` from the `partners` table, replacing the hardcoded list, or (b) if partner curation was deprioritized, remove the non-functional toggle from the admin UI so it stops implying a capability that doesn't exist.

**Needs your input:** Was this feature intentionally shelved, or is it a genuine bug? That determines whether the fix is "wire it up" or "remove the misleading control."

**Effort:** Small to verify; Small–Medium to wire up properly if you want it working.

### P1 — should fix, lower risk but real user-facing inconsistencies

**10. Two places promise a notification that never arrives.** Both the space join-request page ("You will be notified once access is approved") and the event-rejection admin form ("Tell the member what needs to change") describe a notification that no code actually sends. **Fix:** either wire up the missing email/in-app notification in both places (`approveSpaceJoinRequestAction` and `rejectEventSubmissionAction`), or soften the UI copy so it stops promising something that doesn't happen. Effort: Small–Medium per case.

**11. Admin broadcast has no confirmation step and swallows email failures.** One click sends to the entire membership with no preview or "are you sure," and if the email portion partially fails, the admin is never told — the success banner shows regardless. **Fix:** add a confirm step (recipient count + preview) before sending, and surface email delivery failures back to the admin (even just a warning banner if the batch had errors). Effort: Medium.

**12. Deactivated members still receive admin broadcasts.** The broadcast audience query checks a different status field than the one the "Mark inactive" button sets, so deactivation doesn't actually opt someone out of broadcasts. **Fix:** align the broadcast-recipient query to also exclude `profile_status = 'inactive'`. Effort: Small.

**13. The new-staff invite path is inconsistent with every other invite in the app.** `grantStaffRoleAction` calls Supabase's raw invite method directly instead of the shared `sendAccessSetupEmail` helper every other invite flow uses — it's missing the proper redirect and the fallback for someone who already has an unclaimed account. **Fix:** switch it to use the shared helper, same as member/application invites. Effort: Small, and worth doing soon since it's a likely real bug (a new staff member's invite link may not land them in the right place).

### P2 — decisions needed, not urgent code work

**14. There's no way to fully delete a member — only deactivate.** Genuine removal requires a developer working directly in the Supabase dashboard. Worth deciding whether that's acceptable long-term, or whether a real "delete member" admin flow should be built eventually. No immediate action needed for handover, but the incoming developer should know this is the current ceiling.

**15. No second-approver step on publishing Insights/Publications.** One person can draft and publish in the same sitting. Not necessarily wrong, but worth a deliberate decision on whether PATNA wants a two-person review, since right now it only happens if people choose to ask a colleague first.

**16. Lead-handling pipelines have no follow-up/reminder system at all** (no due dates, no notes field, no stale-lead surfacing) — once item 8 above is fixed and admins are actually notified of new leads, it's worth separately deciding if a lightweight follow-up reminder is also wanted, or if that's being tracked elsewhere (a CRM, a spreadsheet).

---

## Suggested order of work

1. Fix item 8 (lead notifications) first — it's the highest real-world cost of anything in this document.
2. Get your decisions on items 1 and 2 (the two original P0s — NDA/Code of Conduct and cohort override) — these are policy questions as much as engineering ones.
3. Verify item 9 (Featured Partners) against the live site and decide the fix direction.
4. Ship items 3–5 and 10–13 — independent, lower-risk, mostly need copy sign-off or are self-contained bug fixes.
5. Flag item 6 (Supabase email branding) to whoever holds Supabase dashboard access.
6. Note items 7, 14, 15, and 16 in the handover as known, deliberate non-fixes — decide later if priorities change.

Let me know which items you want copy drafted for, or if you'd like me to start building any of these now.
