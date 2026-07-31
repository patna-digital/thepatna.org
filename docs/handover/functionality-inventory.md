# PATNA Platform — Functionality Inventory

Purpose: a plain, complete list of everything the platform currently does. Use this two ways: (1) as a checklist to spot anything missing from the rest of the handover, and (2) as reference documentation in its own right. Grouped by who uses each part. File paths are given so a developer can find the code; they can be ignored by anyone just checking scope.

Last built: 2026-07-30, by reading the actual codebase (including features not yet committed to git — flagged below).

---

## 1. Public website (no login required)

- **Home** — landing page with live stats (member/cohort counts) and featured members.
- **About** — org description plus board/secretariat/research people listings.
- **Community** — public directory of active members (paginated, private profiles excluded).
- **Join the community** — public application form (this is the front door of member onboarding — see the [Manual Processes](manual-processes.md) doc for the full pipeline).
- **Contact** — general contact form.
- **Events** — public list and detail pages for events.
- **Insights** — public knowledge/briefs library.
- **Publications** — public research publications library (list + detail).
- **Projects** — public showcase of PATNA's programmes/research projects, including images and map data.
- **Work with us** — hub page linking to three intake forms:
  - **Partner** — partnership enquiry form.
  - **Collaborate** — collaboration proposal form.
  - **Request support** — service request form.
- **Legal** — privacy policy and terms pages.
- **Booking page** (`/book/[slug]`) — public page where anyone can book time on a staff/admin member's calendar, based on that person's configured availability.

## 2. Member portal (login required)

- **Dashboard** — home screen for a logged-in member: today's date, role, joined spaces, recent discussion activity, community stats.
- **Profile** — view/edit full profile (identity, organisation, expertise, visibility settings); download own résumé, signed NDA, and signed Code of Conduct.
- **Onboarding wizard** — guided multi-step setup for new members (identity/contact → organisation/cohort → expertise → visibility & file uploads → review). Full detail in the Manual Processes doc.
- **Member directory** — searchable in-app directory (shows more than the public community page).
- **Spaces (discussion forums)** — list of community spaces (cohort rooms, working groups); join a space; create/edit/read discussion threads and comments; @mention teammates (triggers a notification).
- **Events** — member event calendar; submit a new event (goes to an admin approval queue unless the submitter is an admin, in which case it publishes directly).
- **Insights** — logged-in view of the insights library.
- **Publications** — logged-in view of the publications library.
- **Documents** — view an internally indexed external document (feeds the PATNA Assistant knowledge base).
- **Calendar**
  - View own calendar (auto-syncs connected external calendars — Google/Microsoft/Zoho — hourly).
  - Set own bookable availability windows (powers the public booking page).
  - Connect/manage external calendar accounts and conferencing settings.
- **Settings** — account settings, including notification preferences (email digest frequency, mention emails, opt out of broadcasts).
- **Notifications** — in-app notification bell (mark read / mark all read).
- **Daily work log** *(new — not yet committed to git)* — for members with the `staff` role only: a daily morning check-in (priorities, availability, support needed, risks/blockers) and evening check-out (work completed, progress, projects worked on, issues, wellbeing). Requires a line manager to be assigned before it can be used.

## 3. Admin panel (admin login required)

- **Overview dashboard** — KPI tiles (applications by stage, total members, pending invites) and quick links.
- **Applications** — the full applicant review pipeline: view, filter, review/status changes, assign to a reviewer, assign cohort(s), approve & invite, resend invite, send password reset. (Full step-by-step in the Manual Processes doc.)
- **Members** — full member roster: stats, bulk invite/resend, data-repair utility, activate/deactivate a member, replace headshot/résumé, grant/revoke roles (member, administrator, staff), download a member's signed NDA/Code of Conduct, export the whole roster to CSV.
- **Staff** *(new — not yet committed to git)* — roster of members with the `staff` role: add staff (by email — sends an invite if they don't have an account yet), assign/reassign a line manager, remove staff role, view each staff member's check-in/check-out history and "needs attention" flags (support needed, risks, or concerning wellbeing).
- **Admins** — grant/revoke the `administrator` role.
- **Spaces** — create/edit/delete discussion spaces; manage space membership and roles (member/moderator/lead); approve join requests.
- **Events** — create/edit events directly; review, approve, or reject member-submitted events; manage event photo galleries.
- **Insights** — create/edit/delete insights articles; manage attachments and image galleries. (Also usable by non-admin "publisher" role holders.)
- **Projects** — create/edit/delete projects; manage project image galleries.
- **Partners** — manage partner organisations and their contacts.
- **People** — manage the About page's board/secretariat/research listings, including manual drag-reorder.
- **Leads** — three intake pipelines (partnership, collaboration, service request) from the public "Work with us" forms, plus a unified cross-pipeline leads view.
- **Notifications** — compose and send a platform-wide (or targeted) broadcast email/in-app notice; view broadcast history.
- **Settings** — choose which members are featured on the public homepage.
- **Website** — lightweight CMS controls: featured partners, inline people management, and a "work in progress" toggle to mark specific public pages as under construction.
- **Assistant** — admin console for the PATNA Assistant (AI knowledge base): index health stats, source breakdown, Google Drive source management, manual reindex trigger.

## 4. Accounts, roles & permissions

- Login/logout, forgot-password/reset-password, email verification — standard Supabase-backed auth.
- A member can hold multiple roles at once. Roles in use:
  - `member` — approved community member (granted on application approval).
  - `administrator` — full admin panel access.
  - `publisher` — can manage Insights without full admin access.
  - `staff` — can use the daily work log feature (new).
  - `cohort_lead`, `moderator`, `content_editor` — seeded in the system but not currently wired to any dedicated UI (worth checking whether these are planned or dead).
- A separate "super admin" flag exists on top of the administrator role, with extra protections (e.g. can't self-promote) — reserved for one account today.
- Every table is protected by database-level row security in addition to the app's own page-level checks, so access control isn't only enforced in the Next.js code.

## 5. Notifications (email + in-app)

- In-app notification feed with types: @mention, admin broadcast, space activity, task assignment.
- Per-user notification preferences (in-app vs email, digest frequency, broadcast opt-out).
- Emails sent today, and who they go to:
  - New public application → all admins.
  - New partnership/collaboration/support-request lead (the "Work with us" forms) → all admins. *(Added 2026-07-30 — previously nothing was sent here at all; see the fix plan.)*
  - Application assigned to a reviewer → that admin.
  - Member/staff invite or password reset → the invitee (via Supabase's own auth email, not a custom template).
  - New administrator granted → that person (welcome email).
  - Admin broadcast → members who haven't opted out.
  - Digest email (daily/weekly roundup of new space activity) → members opted into digests.
- **Gap to note:** applicants get no email confirming their application was received, and no email when their status changes to interviewing/waitlisted/declined — see the Manual Processes doc.

## 6. Background / scheduled jobs

- Daily calendar sync (06:00 UTC) — refreshes connected external calendars.
- Document embedding for the PATNA Assistant knowledge base (runs on demand via Supabase Edge Functions, plus a manual admin reindex button).
- A digest-email endpoint exists in the code but **is not currently scheduled anywhere** — it would need to be triggered externally (or added to the cron config) to actually send digests.

## 7. Data model, in one paragraph

Members, roles, cohorts, spaces/threads/comments, community applications, invites, events (with RSVPs), calendars (with external sync), publications/insights/projects (with image galleries and rich content), partners, people profiles, notifications/broadcasts, site settings (for CMS-style toggles), and — newest — staff daily work logs. See `supabase/migrations/` for the full, dated history of how this was built up (58 migrations as of this writing).

---

## Things worth double-checking with the incoming developer / PATNA team

- `cohort_lead`, `moderator`, `content_editor` roles exist in the system but don't appear to be used by any current screen — confirm whether they're planned or can be removed.
- The digest email cron isn't scheduled — confirm whether digests are supposed to be going out.
- No email currently tells an applicant their status changed — confirm whether that's intentional.
