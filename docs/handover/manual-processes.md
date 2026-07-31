# PATNA Platform — Manual Processes & Templates

This document is separate from the admin guide on purpose. The admin guide explains *how to use a screen*. This document explains *the human process a screen is part of* — the sequence someone actually follows from start to finish, including the parts that happen outside the platform entirely (an email, a document sent by hand, a judgment call).

Each process below is written as: what the applicant/member experiences → what the admin must actually click, in order → what happens automatically → any templates/forms involved and where they live → known gaps to be aware of.

---

## Process 1: Member onboarding (application → active member)

### Step-by-step

**1. Prospect applies.**
A prospective member fills in the public form at `/community/join`: name, email, phone, country, organisation, role, areas of expertise, engagement interests, a motivation statement, and a data-consent checkbox. On submit, they see an on-screen "application received" confirmation.

> ⚠️ **No confirmation email is sent to the applicant.** The on-screen message is the only receipt they get. If they close the tab, they have nothing in writing that their application arrived.

**2. Admin is notified automatically.**
Every administrator is emailed a "New PATNA application" notice with the applicant's name, email, country, organisation, and a motivation excerpt, with a link straight to the review screen. No action needed here beyond opening the email.

**3. Admin reviews the application** at `/admin/applications`.
Open the applicant's row, read their details, then:
- **Set a status**: `submitted` → `interviewing` → `approved`, or `waitlist` / `declined`. Add reviewer notes if useful. Click **Save review**.
- Optionally, **assign the review to a specific admin colleague** (click **Assign & notify** — this emails that colleague; it does not email the applicant).
- **Select the cohort(s)** the applicant should join, and mark one as primary. Click **Save cohorts**.

> ⚠️ **Moving status to `interviewing`, `waitlist`, or `declined` sends no email to the applicant.** If PATNA's process includes an interview invitation, a waitlist notice, or a rejection message, that has to be sent manually — by personal email, phone, or whatever channel is currently in use — because the platform does not do it. Whoever owns this process should have a standard message/template for each of these outcomes ready to send by hand (see "Templates needed" below).

**4. Admin approves and invites** — the single most important click in the whole process.
Once satisfied, click **Approve & invite**. This one click automatically:
- Creates the person's login (a Supabase account) if they don't have one yet.
- Sends them an email with a secure link to set their password.
- Creates their member profile, pre-filled from their application answers.
- Grants them the `member` role.
- Tags them with the expertise areas they selected on the form.
- Assigns them to the cohort selected in step 3, **but only if they don't already have a cohort** — see the flag below.
- Marks the application `approved`.

There is nothing else to do after this click — the system takes it from here until the new member sets their password.

> If the applicant loses or ignores that email, use **Resend invite link** on the same screen. If someone who already has an account gets locked out later, use **Send password reset** instead.

**5. Applicant sets their password** by clicking the emailed link. This is self-service — nothing for an admin to do.

> ⚠️ **The wording of that email is not controlled by this codebase.** It's Supabase's own built-in "invite" or "password reset" email template. If PATNA wants a branded, custom-worded invite email, that has to be changed in the Supabase project's own email template settings, not in the website code.

**6. New member completes the onboarding wizard** inside the app (self-service, no admin involved): contact details → organisation & cohort → expertise → optional file uploads (headshot, CV, signed NDA, signed Code of Conduct) → review. The moment their required fields are filled in, their account automatically flips to fully "active" — **there is no admin approval step for this**, and none of the file uploads (CV, NDA, Code of Conduct) are actually required to reach "active" status.

> ⚠️ **Cohort assignment can be silently overwritten by the member.** The cohort an admin carefully picked in step 3 is only a *default* — if the new member changes the "primary cohort" dropdown during their own onboarding (and nothing stops them picking any cohort in the system), their choice wins. **Admins should double-check a new member's final cohort after they finish onboarding**, rather than assuming step 3 stuck.

### Templates and forms involved

| What | Where it lives today |
|---|---|
| Public application form | Built into the website (`/community/join`) — no external form/template, all fields are in the site itself. |
| "New application" email to admins | Built-in, automatic, sent by the platform. |
| Invite / password-setup email to the applicant | **Not a PATNA-branded template** — this is Supabase's default auth email, configured in the Supabase project dashboard (outside this codebase). |
| Interview invitation / waitlist notice / rejection message to applicants | **Does not exist as a template anywhere.** This is sent by hand today (or should be) — recommend PATNA write and save a standard short message for each of these three outcomes so it's consistent and not reinvented each time. |
| **NDA and Code of Conduct** | **No blank template exists in the platform at all.** The platform only has a place to *upload a signed copy* once someone has one — there is no button that sends a blank NDA or Code of Conduct to a new member. Whoever manages onboarding today must be sending these from somewhere else entirely (email attachment, Google Doc, DocuSign, etc.). **This is the single biggest gap to close before handover**: find out where that blank template currently lives (whose inbox, whose Drive) and either (a) document that location here, or (b) get it into a shared, findable place — because right now it exists only in institutional memory. |
| CV / résumé | Member uploads their own — no PATNA-provided template. |

### Known gaps, worth a decision before the new developer starts

1. No applicant-facing confirmation email on submission.
2. No applicant-facing email on status change (interview/waitlist/decline).
3. NDA/Code of Conduct have no source template in the platform, and aren't required to become an active member — if that's meant to be a hard requirement, it isn't enforced anywhere and currently relies on an admin manually checking a member's profile.
4. A member's own cohort choice can override the admin's assignment without any warning to the admin.
5. The invite email's wording lives in Supabase's settings, not in this repository — a future copy change needs to happen in the Supabase dashboard.

---

## Process 2: Member offboarding / deactivation

### Step-by-step

1. Admin opens **Admin → Members**, finds the member, and clicks **Mark inactive** (a single toggle button, on either the list row or the member's detail page). **There is no confirmation prompt** — one click takes effect immediately. Reversing it later is the same button, now labelled **Mark active**.
2. The system updates `profile_status` on that member's profile and re-syncs the internal AI-assistant search index. That's it — nothing else happens automatically.
3. There's no bulk version of this — deactivation is one member at a time. (The only bulk member actions are bulk-invite and a data "repair" utility, both of which do have a confirmation step.)

### What "inactive" actually does — and doesn't do

**It is not a login block.** An inactive member can still sign in and use their account normally — deactivation only affects whether they *show up* in various lists:
- Removed from the public member directory and the in-app member directory.
- Excluded from the "add to space" and "add to project" pickers admins use.
- Excluded from the AI assistant's searchable content.

**It does not remove them from anything they're already part of.** Spaces, cohorts, and any threads/comments they've posted are untouched — deactivation only affects future pickers, not existing memberships.

**It does not notify the member.** No email, no in-app message — they simply find their spaces/directory presence unchanged from their own point of view, since they're not logged out.

**There is no way to fully delete a member.** Deactivation is the only offboarding tool that exists in the admin UI. Genuinely removing someone's account and data would require a developer to do it directly in the Supabase dashboard/database — there's no supported in-app "delete member" flow. Worth deciding whether that's acceptable long-term or whether a proper deletion path should be built.

### Gap to flag

Deactivated members still receive admin broadcast messages (see Process 4) — the broadcast audience is filtered by a different status field than the one deactivation sets, so "inactive" doesn't mean "opted out of broadcasts."

---

## Process 3: Space join-request approval

### Step-by-step

1. A member tries to open a private/restricted discussion space they haven't joined and is redirected to a "Request access" page, where they can add a short note and click **Request access**. They're shown the message: *"You will be notified once access is approved."*
2. The request is logged internally (it rides on the same general-purpose request system used for the "Work with us" leads, not a dedicated join-requests table).
3. **There is no single place to see all pending join requests across every space.** An admin has to open **Admin → Spaces → [that specific space] → Members** to see if it has any pending requests — one space at a time, with nothing prompting them to check.
4. If there are pending requests, they appear as a card at the top of that space's Members page: requester name, email, organisation, their note, and a role picker (member/moderator/lead).
5. Admin picks a role and clicks **Approve and add member**. That's the only button — **there is no "decline" option anywhere in the product.** An unwanted request can only be closed by directly editing the database.
6. Approving adds them to the space — but **no notification is sent to the requester**, despite the platform telling them one would come. They only discover access was granted by returning to the space themselves.

### Gaps to flag

- The promise "You will be notified once access is approved" is not backed by any actual email or in-app notification — this is a real mismatch between what members are told and what happens, worth fixing or removing the wording.
- No cross-space queue means join requests are easy to miss if a space isn't checked regularly.
- No reject option exists in the UI.

---

## Process 4: Admin broadcast messages

### Step-by-step

1. Admin opens **Admin → Notifications**, clicks **+ New broadcast**, and fills in a subject, a plain-text message, and an audience (**All members**, or **by cohort** — a "specific people" option exists in the underlying system but isn't reachable from this screen). Email delivery is on by default alongside the always-on in-app notification.
2. Admin clicks **Send broadcast**. **This is the only step — there is no confirmation prompt and no preview of the finished message before it goes out** to what could be the entire membership.
3. The system logs the broadcast, creates in-app notifications for the audience, and — if email was selected — fires off the emails in the background. **Email sending is "fire and forget": if it fails partway through, the admin is never told, and the success message shown on-screen doesn't reflect whether the emails actually went out.**
4. A history table on the same page shows the last 50 broadcasts, which is the only way to check "did we already send something like this recently" — there's no automatic duplicate warning.

### Gaps to flag

- No confirmation/preview step before an irreversible send to the whole membership.
- Any administrator can send a broadcast to everyone — there's no extra permission tier for this higher-risk action, worth deciding if that's intentional.
- Deactivated members (see Process 2) still receive broadcasts.
- If the in-app portion of a broadcast fails partway, it can get stuck showing as "pending" indefinitely with no retry or alert.

---

## Process 5: Event submission moderation

### Step-by-step

1. A regular member (not an admin) fills in the event submission form at `/app/events/submit`: title, type, organising institutions, dates, location, summary, description, PATNA's role, themes, and a link. (If an admin does this instead, they're sent straight to the "create event" screen — admins skip this queue entirely.)
2. On submit, it's saved as a pending submission and the member sees an on-page confirmation. **No email or notification is sent to them at this point.**
3. **There's no badge or counter anywhere prompting an admin to check for pending submissions** (unlike the Leads section, which does show a count) — an admin has to remember to visit the submissions queue.
4. When they do, they open the submission, can edit any field, and set the event's schedule status, visibility (public/members/restricted), and publish status (draft/published/archived — defaults to published).
5. Clicking **Approve and create event** publishes it as a real, live event immediately (using whatever visibility the admin chose — it defaults to "members," not fully public, so an admin who wants it public has to change that explicitly).
6. Clicking **Reject submission** instead leaves a reviewer note and marks it rejected — the event is never created. The rejection form's own on-screen copy says "Tell the member what needs to change," **but nothing actually sends that note to the member** — it just sits in the admin record. If the member needs to hear the feedback, someone has to relay it manually.

### Gaps to flag

- No notification to the submitting member either way (approved or rejected) — same missing-notification pattern as space join requests.
- The rejection screen implies feedback is delivered to the member; it isn't.
- No queue badge, so pending submissions rely entirely on an admin remembering to check.
- Default visibility on approval is "members," easy to overlook if the intent was a public event.

---

## Process 6: Lead handling (Partner / Collaborate / Request-support forms)

> ✅ **Update (2026-07-30):** the notification gap described below has been fixed — see "What changed" at the end of this section. Steps 1–5 below are left as originally written for the historical record of how the process behaves once a lead is in the system; only the "no one is told" gap has been closed.

### Step-by-step

1. An external visitor fills in one of three public forms under "Work with us": **Partner**, **Collaborate**, or **Request support** — each collects contact details plus form-specific fields (e.g. budget range for partnerships, a proposal for collaborations, request details and timeline for support requests).
2. On submit, it's saved straight into the relevant pipeline (partnership leads / collaboration leads / service requests) with status "new." **Every administrator is now emailed automatically** with the submitter's details and a direct link into the right admin review screen (fixed 2026-07-30 — previously nothing was sent; see below). There is still no confirmation email to the submitter themselves — only the on-screen "thank you" message.
3. Admin opens **Admin → Leads** (a unified view of all three pipelines, or the three separate list pages) — now prompted to by the email in step 2, rather than having to remember to check. Each lead can be opened and edited: status (each pipeline has its own set of stages ending in something like `closed_won`/`closed_lost`, `agreed`/`declined`, or `completed`/`cancelled`), and who internally is "assigned to" it.
4. Progressing or closing a lead is purely a matter of manually changing its status and saving — nothing else happens automatically, and assigning it to a colleague doesn't notify them either.
5. There's still no notes field, no follow-up date, and no reminder/SLA system anywhere in this pipeline — once an admin has seen the initial alert, keeping a lead moving after that still relies on them remembering to revisit it.

### What changed

Previously, a real partnership enquiry, collaboration proposal, or support request could arrive and sit completely unseen indefinitely — there was no email alert to any admin, only a small sidebar badge nobody was prompted to look at. This was flagged as the most serious gap in this document.

**Fixed 2026-07-30** ([PR #58](https://github.com/patna-digital/thepatna.org/pull/58)): every administrator now receives an email the moment any of the three forms is submitted, using the same branded template pattern as the existing "new community application" alert. New files: `apps/web/lib/email/templates/lead-notification.js`, `apps/web/lib/lead-notifications.js`; wired into all three forms' submit actions.

**Still open:** no confirmation email to the person submitting the form, and no follow-up/reminder system once an admin has seen the alert (see the fix plan for both).

---

## Process 7: Insights / Publications editorial workflow

### Step-by-step

1. Anyone with the `administrator` role, the `publisher` role, or the super-admin flag can create a new insight/publication: title, type (report/brief/case study/article/workshop), summary, body, tags, cover image, an SEO description, "feature this" and "needs review" checkboxes, and — importantly — a status of **draft**, **published**, or **archived**.
2. Nothing is visible to the public or to members until status is switched to **published**. The first time that happens, a publish date is automatically stamped.
3. **The same person who drafts something can publish it themselves in the same action — there is no second-approver step.** The "flag as needing review" checkbox only adds a note-to-self style marker (it feeds a badge count) — it doesn't stop the item from being published, and the same person can tick and untick it themselves.
4. Publishing something doesn't trigger any announcement — if PATNA wants members to know about a new publication, someone has to separately send an admin broadcast (Process 4); it isn't automatic.

### Gap to flag

If PATNA wants a two-person review before anything goes public, that doesn't exist today — it would rely entirely on people agreeing to follow that practice by convention, which is easy to let slip. Worth deciding whether this needs to be enforced in the system or left as a trust-based process.

---

## Process 8: Featured members, featured partners & "work in progress" page curation

All three of these live on the **Admin → Website** (and, for members, **Admin → Settings**) screens.

### Featured members ("Community Snapshot" on the homepage)
Admin chooses either "Default" (automatically shows recently active members, no upkeep needed) or "Custom" (hand-picks up to 8 specific members). Whatever is chosen stays exactly as-is — indefinitely — until an admin manually comes back and changes it. There's no expiry or rotation.

### Featured partners
Admin ticks a checkbox per partner organisation to mark it "featured."

> ⚠️ **This appears to currently do nothing on the live site.** Tracing the code, the homepage's partner logo section is driven by a separate, hardcoded list of partner names in the codebase — not by the partners database table or this "featured" checkbox at all. Before documenting this as a working feature, it's worth confirming directly against the live site whether toggling this checkbox visibly changes anything. If it doesn't, this is either an unfinished feature or dead code that should be flagged to the incoming developer either way.

### "Work in progress" page toggle
Admin ticks which of a fixed list of top-level public pages (Home, About, Projects, Insights, Events, Community, Work With Us) should show a "we're polishing this one" placeholder to every visitor instead of the real page. Takes effect immediately for all visitors, with no confirmation step — including for the homepage itself. Stays in that state indefinitely until an admin manually unchecks it. The placeholder wording itself is fixed in the code, not editable from the admin screen — changing that text needs a developer.

### Gaps to flag

- Featured Partners toggle likely has no real effect — needs verifying and either fixing or removing.
- None of these three have any expiry/reminder — "set and forget" is easy to do by accident.
- Marking the homepage as "work in progress" has no extra confirmation step, so a misclick takes the whole homepage down for every visitor with just one click.

---

## Process 9: Staff daily-log monitoring *(new feature)*

### Step-by-step

1. A staff member's morning check-in and evening check-out (priorities, availability, whether they need support, risks/blockers, wellbeing) get saved to the system as they submit each form.
2. If any answer indicates a concern (support requested, a risk/blocker flagged, an issue encountered, or a "under pressure"/"please contact me" wellbeing answer), that day is marked "needs attention" internally.
3. **The only way anyone finds out is if an admin opens the Staff roster page and visually scans for an amber "Needs attention" chip.** There's no filter to show flagged staff only, no sort by urgency, and — most importantly — **no email, no in-app alert, nothing pushed to anyone** when a flag occurs. Detection is entirely passive.
4. Even after spotting a flag and opening that staff member's detail page, the admin only sees *that* something was flagged, not the actual written detail the staff member typed (e.g. what the risk or issue actually was) — that level of detail isn't surfaced in the admin screens at all today.
5. A staff member's line manager has no dedicated view of their own reports at all — only people with full administrator access can see this page. So today, a line manager who isn't also an admin can't see their own team's check-ins.

### Gap to flag

If this feature is meant to catch someone who needs help quickly, it currently can't — there's no push notification of any kind, and the person best placed to notice (the line manager) may not even have access to see it. Recommend deciding who should own checking this page and how often, and consider whether an alert (even a simple daily email listing flags) is worth adding.

---

## Process 10: Assigning a line manager to new staff *(new feature)*

### Step-by-step

1. Admin opens **Admin → Staff**, types the new staff member's email, and picks a line manager from a required dropdown (anyone who's already an admin or existing staff member) — the form won't submit without both.
2. If that email doesn't have an account yet, the system sends them an invite to create one. If they already have an account, they're simply granted the staff role and assigned that line manager right away.
3. A staff member cannot use the daily log at all until they have a line manager assigned — if that's ever missing, they see a blocking error message and nothing else, with no way to fix it themselves; an admin has to go back into the Staff section and assign one.
4. A line manager can be changed later from that staff member's detail page, but it can't be *removed* once set — the same "must pick one" rule applies there too.

### Gap to flag

The invite email sent to a brand-new staff member here uses a different, more basic mechanism than every other invite in the platform (member invites, application approvals) — worth a developer double-checking this path works reliably, since it skips the shared logic the rest of the app relies on. See the fix plan.

---

## Process 11: PATNA Assistant re-indexing (the AI knowledge base)

### What happens automatically (no admin action needed)

Most day-to-day content — member profiles, applications, discussion threads and comments, published insights, and events — re-indexes itself into the AI assistant automatically the moment it's saved. An admin doing normal work (approving an application, publishing an insight) doesn't need to think about this at all.

### What needs a manual step

1. **Google Drive-sourced documents** — only re-check a connected Drive folder for new/changed files when an admin manually clicks "Sync now" on that source. Nothing detects new files dropped into Drive automatically.
2. **The "Incremental sync" button** — a manual safety-net that re-processes roughly the last 20 changed items across each content type. It's a backstop for when an automatic sync silently failed, not the primary mechanism (since most things already sync themselves).
3. **A full ground-up rebuild** of the entire index is only available as a command a developer runs from a terminal — there's no button for a non-technical admin to trigger this.

### Adding a new Google Drive knowledge source

This is a genuine multi-step process: the target Drive folder must first be set to "anyone with the link can view" in Google Drive itself (this platform can only read public folders, not private ones), then an admin adds the folder's link and a label in the admin screen, and the system does an initial scan and indexes every PDF in it (only PDFs — nothing else). After that, keeping it current is manual: an admin has to remember to click "Sync now" whenever files change in that folder.

### Gap to flag

There's a passive "index health" panel showing whether the underlying infrastructure is working and when anything was last indexed, but nothing actively alerts anyone if it breaks or goes stale — an admin has to think to open that page and check.

---

## Summary — is anything still undocumented?

Between member onboarding and the ten processes above, this covers every place found in the codebase where a human, not the system, drives an outcome. If something else comes to mind that isn't listed here, it's worth adding as its own section using the same format (steps, who does what, templates, gaps) before handover.
