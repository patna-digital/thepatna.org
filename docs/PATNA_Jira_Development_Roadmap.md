# PATNA Platform — Jira-Aligned Product Development Roadmap

**Version:** 1.0
**Date:** May 2026
**Status:** Living Document

**Status Key:**
- ✅ Done — shipped and live
- ⚙️ In Progress — actively being worked
- 📋 Planned — scoped and prioritised for near-term delivery
- 🔲 Backlog — identified, not yet scheduled

**Priority Key:**
- P0 — Critical / launch-blocking
- P1 — High / core experience
- P2 — Medium / enhancement
- P3 — Low / nice-to-have

**Estimate Key:** S (≤ 1 day) · M (2–3 days) · L (4–7 days) · XL (> 1 week)

---

## Timeline Overview

| Period | Milestone |
|---|---|
| Mar 29 – Mar 31, 2026 | Platform scaffold, public site launch, member workspace MVP |
| Apr 1 – Apr 7, 2026 | Calendar integration, i18n, admin UI consistency pass |
| Apr 7 – Apr 15, 2026 | Projects, spaces, service pipelines, PATNA AI Assistant launch |
| Apr 15 – May 10, 2026 | Drive sync, publication reader, project knowledge graph, admin refresh |
| May 10 – May 19, 2026 | Web UI refresh, global styles, marketing pages redesign |
| May 20 – Jun 30, 2026 | Backlog: notifications, settings hardening, pipeline deletion, i18n parity |
| Jul – Sep 2026 | Planned: 2FA, dark mode, mobile-readiness, analytics |
| Oct – Dec 2026 | Horizon: mobile app, open API, full multilingual rollout |

---

## Epic Index

| Epic ID | Title | Status |
|---|---|---|
| [EP-01](#ep-01-public-platform) | Public Platform | ✅ Done |
| [EP-02](#ep-02-auth--onboarding) | Auth & Onboarding | ✅ Done |
| [EP-03](#ep-03-member-workspace) | Member Workspace | ✅ Done |
| [EP-04](#ep-04-calendar--booking) | Calendar & Booking | ⚙️ In Progress |
| [EP-05](#ep-05-content--publications) | Content & Publications | ✅ Done |
| [EP-06](#ep-06-events-management) | Events Management | ✅ Done |
| [EP-07](#ep-07-projects--knowledge-graph) | Projects & Knowledge Graph | ✅ Done |
| [EP-08](#ep-08-admin-operations-hub) | Admin Operations Hub | ⚙️ In Progress |
| [EP-09](#ep-09-patna-ai-assistant) | PATNA AI Assistant | ⚙️ In Progress |
| [EP-10](#ep-10-platform-hardening) | Platform Hardening | 📋 Planned |

---

## EP-01: Public Platform

**Goal:** Launch a polished, publicly accessible marketing and publishing site that introduces PATNA, showcases its work, and converts visitors into applicants or partners.
**Shipped:** March 2026
**Overall Status:** ✅ Done

---

### Feature: F-01-1 — Marketing Pages

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-01-01 | As a public visitor, I want to view the PATNA homepage so that I can understand what the organisation does. | P0 | L | ✅ Done |
| US-01-02 | As a public visitor, I want to read the About page so that I can learn about PATNA's history, mission, LEAP phases, and governance structure. | P0 | L | ✅ Done |
| US-01-03 | As a public visitor, I want to see PATNA's partner logos so that I understand the network's credibility and reach. | P1 | S | ✅ Done |
| US-01-04 | As a public visitor, I want to browse the Projects catalogue so that I can understand PATNA's active and completed policy work. | P0 | M | ✅ Done |
| US-01-05 | As a public visitor, I want to read individual project pages with workstreams, activities, and geographic footprint so that I can engage with the depth of each project. | P1 | L | ✅ Done |

---

### Feature: F-01-2 — Inbound Inquiry Forms

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-01-06 | As a potential partner, I want to submit a partnership application so that PATNA can evaluate our collaboration opportunity. | P0 | M | ✅ Done |
| US-01-07 | As an organisation, I want to submit a service request so that PATNA can assess whether it can provide research or policy support. | P0 | M | ✅ Done |
| US-01-08 | As a collaborator, I want to submit a collaboration lead so that PATNA can consider joint initiatives. | P1 | M | ✅ Done |
| US-01-09 | As a visitor, I want to contact PATNA directly so that I can ask questions not covered by the other forms. | P1 | S | ✅ Done |

---

### Feature: F-01-3 — Public Events & Insights

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-01-10 | As a public visitor, I want to browse upcoming and past events so that I can attend or stay informed about PATNA's activities. | P0 | M | ✅ Done |
| US-01-11 | As a public visitor, I want to read published insights and reports so that I can access PATNA's knowledge outputs. | P0 | M | ✅ Done |
| US-01-12 | As a public visitor, I want to read PATNA's Privacy Policy and Terms of Service so that I understand how my data is handled. | P0 | S | ✅ Done |

---

### Feature: F-01-4 — 2026 Homepage & About Redesign

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-01-13 | As a visitor, I want to see a hero video on the homepage so that PATNA's work is immediately compelling and vivid. | P1 | M | ✅ Done |
| US-01-14 | As a visitor, I want to see a community snapshot with member cards so that I understand who makes up the PATNA network. | P1 | M | ✅ Done |
| US-01-15 | As a visitor, I want to see board and secretariat member profiles on the About page so that PATNA's governance is transparent. | P1 | M | ✅ Done |

---

## EP-02: Auth & Onboarding

**Goal:** Deliver a secure, invite-only access flow that takes a successful applicant from email invitation to a fully set-up member profile.
**Shipped:** March 2026
**Overall Status:** ✅ Done

---

### Feature: F-02-1 — Invite-Based Access Flow

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-02-01 | As an admin, I want to issue invite tokens to approved applicants so that only vetted individuals can create accounts. | P0 | M | ✅ Done |
| US-02-02 | As an invited applicant, I want to accept an invite via email link so that I can create my account without a public sign-up form. | P0 | M | ✅ Done |
| US-02-03 | As a new member, I want to set my password during invite acceptance so that my account is immediately secured. | P0 | S | ✅ Done |
| US-02-04 | As a member, I want to reset my password via email so that I can recover access if I forget it. | P0 | S | ✅ Done |
| US-02-05 | As an admin, I want to view the status of all issued invite tokens (pending, accepted, expired) so that I can track onboarding progress. | P1 | M | ✅ Done |

---

### Feature: F-02-2 — Member Onboarding Flow

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-02-06 | As a new member, I want to be guided through a profile completion flow after first login so that my profile is ready for the directory. | P0 | L | ✅ Done |
| US-02-07 | As a new member, I want to upload my headshot during onboarding so that other members can recognise me in the directory. | P1 | M | ✅ Done |
| US-02-08 | As a new member, I want to review and sign the Code of Conduct so that I understand community expectations before I engage. | P0 | M | ✅ Done |
| US-02-09 | As a new member, I want to review and sign the NDA so that my obligations around confidential content are clear. | P0 | M | ✅ Done |
| US-02-10 | As an admin, I want to view which members have completed each compliance document so that I can chase outstanding signatures. | P1 | M | ✅ Done |

---

### Feature: F-02-3 — Community Application Intake

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-02-11 | As a prospective member, I want to submit a community application via the public site so that PATNA can evaluate my fit for the network. | P0 | M | ✅ Done |
| US-02-12 | As an admin, I want to review, approve, and reject community applications so that I can control the quality of membership. | P0 | L | ✅ Done |
| US-02-13 | As an admin, I want to bulk-import cohort members from a CSV so that large cohort onboarding can be done efficiently. | P1 | L | ✅ Done |

---

## EP-03: Member Workspace

**Goal:** Give members a rich, collaborative digital home for professional networking, knowledge sharing, and community participation.
**Shipped:** March–April 2026
**Overall Status:** ✅ Done

---

### Feature: F-03-1 — Member Profiles

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-03-01 | As a member, I want to view and edit my profile (bio, organisation, role, tags) so that other members can discover me. | P0 | L | ✅ Done |
| US-03-02 | As a member, I want to set my profile visibility (members only, public, private) so that I control who can see my information. | P0 | M | ✅ Done |
| US-03-03 | As a member, I want to upload my résumé so that others can learn about my professional background. | P1 | M | ✅ Done |
| US-03-04 | As a member, I want to set my availability status (available, limited, unavailable) so that peers know whether to reach out for collaborations. | P1 | S | ✅ Done |
| US-03-05 | As a member, I want to view another member's profile in a modal so that I can quickly check their details without leaving the current page. | P2 | M | ✅ Done |

---

### Feature: F-03-2 — Member Directory

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-03-06 | As a member, I want to search the member directory by name, organisation, or domain tag so that I can find relevant peers quickly. | P0 | M | ✅ Done |
| US-03-07 | As a member, I want to filter the directory by cohort and availability so that I can target members most relevant to my current needs. | P1 | M | ✅ Done |
| US-03-08 | As an admin, I want server-side search on the members list so that searches remain fast as the membership scales beyond 100 members. | P1 | M | 📋 Planned |

---

### Feature: F-03-3 — Spaces & Discussions

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-03-09 | As a member, I want to browse and join spaces (cohort rooms, working groups, constituencies, geographies) so that I can participate in relevant communities. | P0 | L | ✅ Done |
| US-03-10 | As a member, I want to create discussion threads within a space so that I can share ideas and start conversations. | P0 | M | ✅ Done |
| US-03-11 | As a member, I want to comment on threads so that I can contribute to ongoing discussions. | P0 | M | ✅ Done |
| US-03-12 | As a member, I want to edit my own threads so that I can correct errors or add follow-up information. | P1 | S | ✅ Done |
| US-03-13 | As a moderator, I want to delete threads or comments that violate community guidelines so that the space remains safe and productive. | P1 | M | ✅ Done |
| US-03-14 | As a member, I want to receive notifications when someone replies to my thread so that I can stay engaged in conversations. | P1 | L | 🔲 Backlog |

---

### Feature: F-03-4 — Member Settings

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-03-15 | As a member, I want to change my profile visibility and availability from the settings page so that I don't need to go into the full profile editor. | P0 | M | ✅ Done |
| US-03-16 | As a member, I want to change my password from the settings page so that I can maintain account security. | P1 | S | ✅ Done |
| US-03-17 | As a member, I want to manage notification preferences (email digest, mention alerts) so that I receive only the communications I want. | P2 | L | 🔲 Backlog |
| US-03-18 | As a member, I want to enable two-factor authentication so that my account is protected against unauthorised access. | P1 | L | 📋 Planned |
| US-03-19 | As a member, I want to view an activity log of my recent actions so that I can audit my own engagement on the platform. | P3 | M | 🔲 Backlog |

---

## EP-04: Calendar & Booking

**Goal:** Allow members to connect their calendars, set availability rules, and offer a public booking page so that peers and external stakeholders can schedule time with them.
**Shipped:** April 2026 (core); refinements in progress.
**Overall Status:** ⚙️ In Progress

---

### Feature: F-04-1 — Calendar Connections

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-04-01 | As a member, I want to connect my Google Calendar so that my availability reflects my actual schedule. | P0 | L | ✅ Done |
| US-04-02 | As a member, I want to connect my Microsoft Outlook calendar so that I can use my work calendar for PATNA bookings. | P0 | L | ✅ Done |
| US-04-03 | As a member, I want to connect my Zoho Calendar so that I have a third-party alternative to Google and Microsoft. | P1 | L | ✅ Done |
| US-04-04 | As a member, I want to connect via iCal/Apple Calendar so that I can sync any standard calendar. | P2 | M | ✅ Done |
| US-04-05 | As a member, I want to see branded icons for each calendar provider so that the connection UI is clear and recognisable. | P2 | S | ✅ Done |
| US-04-06 | As a member, I want my connected calendars to sync automatically so that my availability is always current without manual refresh. | P0 | L | ✅ Done |

---

### Feature: F-04-2 — Availability Rules & Booking Pages

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-04-07 | As a member, I want to define recurring availability windows (e.g., Tuesdays 10–12) so that others can only book within my open hours. | P0 | L | ✅ Done |
| US-04-08 | As a member, I want to set exception dates (holidays, unavailable days) so that my booking page stays accurate. | P1 | M | ✅ Done |
| US-04-09 | As a member, I want a public booking URL so that peers and external stakeholders can schedule a meeting without emailing back and forth. | P0 | M | ✅ Done |
| US-04-10 | As a visitor on a member's booking page, I want to select a time slot and submit my booking so that I can schedule a meeting with that member. | P0 | L | ✅ Done |
| US-04-11 | As a member, I want to confirm, reschedule, or cancel a booking so that I maintain control over my calendar. | P1 | M | ✅ Done |
| US-04-12 | As a member, I want booking confirmation emails sent to both parties so that we both have a record of the scheduled meeting. | P1 | M | 📋 Planned |
| US-04-13 | As a member, I want conferencing links (Google Meet, Teams) automatically attached to bookings so that there is no extra setup required. | P1 | M | ✅ Done |
| US-04-14 | As a member, I want timezone detection on my booking page so that international visitors see slots in their local time. | P0 | M | ✅ Done |

---

## EP-05: Content & Publications

**Goal:** Provide a structured content library — insights, reports, briefings, and publications — that members and the public can discover and download.
**Shipped:** April–May 2026
**Overall Status:** ✅ Done

---

### Feature: F-05-1 — Insights (Blog / Reports / Briefings)

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-05-01 | As an editor, I want to create and publish insights (blog posts, reports, briefings) so that PATNA's knowledge is accessible to members and the public. | P0 | L | ✅ Done |
| US-05-02 | As an editor, I want to tag insights by domain and cohort relevance so that members see content most applicable to them. | P1 | M | ✅ Done |
| US-05-03 | As an editor, I want to upload gallery images for an insight so that the article is visually rich. | P2 | M | ✅ Done |
| US-05-04 | As a member, I want to filter insights by type and cohort relevance so that I can quickly find the content most useful to me. | P1 | M | ✅ Done |
| US-05-05 | As an editor, I want to link an insight to related countries so that the platform can surface geographically-relevant content. | P2 | M | ✅ Done |

---

### Feature: F-05-2 — Publications Library

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-05-06 | As an admin, I want to upload publications with PDF attachments so that members can access PATNA's formal documents. | P0 | M | ✅ Done |
| US-05-07 | As a member, I want to read a publication in an in-browser reader so that I don't need to download before viewing. | P1 | L | ✅ Done |
| US-05-08 | As a member, I want to download publication attachments so that I can save them for offline use. | P0 | S | ✅ Done |
| US-05-09 | As a member, I want to see publications indexed in the AI Assistant so that I can ask questions about their content. | P1 | L | ✅ Done |

---

### Feature: F-05-3 — Project Knowledge Graph

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-05-10 | As a member, I want to view a visual knowledge graph of how projects, events, and content relate to each other so that I can understand PATNA's interconnected body of work. | P1 | XL | ✅ Done |
| US-05-11 | As a member, I want to navigate the knowledge graph interactively so that I can explore relationships between projects and publications. | P2 | L | ✅ Done |
| US-05-12 | As an admin, I want to link a project to related events and insights so that the knowledge graph is accurate and comprehensive. | P1 | M | ✅ Done |

---

## EP-06: Events Management

**Goal:** Enable admin-curated event publishing, member event submissions, RSVP tracking, and post-event output capture.
**Shipped:** March–April 2026
**Overall Status:** ✅ Done

---

### Feature: F-06-1 — Admin Event Management

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-06-01 | As an admin, I want to create and publish events with title, description, date, location, and cover image so that members and the public can discover upcoming PATNA activities. | P0 | M | ✅ Done |
| US-06-02 | As an admin, I want to schedule events for future publication so that I can prepare content in advance. | P1 | S | ✅ Done |
| US-06-03 | As an admin, I want to upload an event gallery so that post-event pages are visually engaging. | P2 | M | ✅ Done |
| US-06-04 | As an admin, I want to review and approve member-submitted events so that community-led activities are surfaced on the platform with editorial oversight. | P1 | M | ✅ Done |
| US-06-05 | As an admin, I want to see event statistics (total, upcoming, TBC, past) so that I have an operational overview at a glance. | P1 | S | ✅ Done |

---

### Feature: F-06-2 — Member Event Participation

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-06-06 | As a member, I want to browse and RSVP to events so that I can confirm my attendance and receive reminders. | P0 | M | ✅ Done |
| US-06-07 | As a member, I want to submit an event for PATNA's consideration so that community-initiated activities can receive platform visibility. | P1 | M | ✅ Done |
| US-06-08 | As a member, I want to track the status of my submitted event so that I know when it has been reviewed. | P1 | S | ✅ Done |
| US-06-09 | As a member, I want to add a PATNA event to my personal calendar so that it appears alongside my other commitments. | P2 | M | 📋 Planned |

---

## EP-07: Projects & Knowledge Graph

**Goal:** Maintain a rich, navigable catalogue of PATNA's project work with workstreams, activities, geographic footprint, and cross-linking to events, content, and organisations.
**Shipped:** April–May 2026
**Overall Status:** ✅ Done

---

### Feature: F-07-1 — Project Catalogue

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-07-01 | As an admin, I want to create projects with title, summary, body, highlights, and status so that PATNA's portfolio is documented and discoverable. | P0 | L | ✅ Done |
| US-07-02 | As an admin, I want to define project workstreams and activities so that the scope and structure of each project is clear. | P1 | M | ✅ Done |
| US-07-03 | As an admin, I want to link a project to external contributors and organisations so that PATNA's partnerships are visible. | P1 | M | ✅ Done |
| US-07-04 | As a public visitor, I want to view a project's geographic footprint on a map so that I can see where PATNA's work has impact. | P1 | L | ✅ Done |

---

### Feature: F-07-2 — Project Hierarchy

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-07-05 | As an admin, I want to assign parent-child relationships between projects so that large programmes with multiple sub-projects are organised correctly. | P1 | M | ✅ Done |
| US-07-06 | As a member, I want to navigate a project hierarchy view so that I understand how PATNA's programme portfolio is structured. | P1 | M | ✅ Done |

---

### Feature: F-07-3 — Cross-Linking & Places

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-07-07 | As an admin, I want to link a project to related events and publications so that users can navigate between connected pieces of work. | P1 | M | ✅ Done |
| US-07-08 | As an admin, I want to associate projects with specific places (cities, regions) so that PATNA's geographic engagement is granular and searchable. | P2 | L | ✅ Done |
| US-07-09 | As an admin, I want a place lookup tool that resolves location names to coordinates so that I don't need to enter coordinates manually. | P2 | M | ✅ Done |

---

## EP-08: Admin Operations Hub

**Goal:** Give PATNA staff a powerful, consistent, and efficient control centre for governing membership, managing content, and operating service pipelines.
**Shipped:** March–May 2026 (ongoing refinements)
**Overall Status:** ⚙️ In Progress

---

### Feature: F-08-1 — Member Management

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-01 | As an admin, I want to view all members with their cohort, role, and status so that I have a full operational picture of the community. | P0 | M | ✅ Done |
| US-08-02 | As an admin, I want to search and filter members by name, cohort, and status so that I can find specific members quickly. | P0 | M | ✅ Done |
| US-08-03 | As an admin, I want to perform bulk actions on selected members (e.g., send communication) so that I can manage groups efficiently. | P1 | L | ✅ Done |
| US-08-04 | As an admin, I want to export the member list as a CSV so that I can use member data in external tools. | P1 | M | ✅ Done |
| US-08-05 | As an admin, I want to view and edit an individual member's profile including cohort assignment so that I can correct data or update status. | P0 | M | ✅ Done |
| US-08-06 | As an admin, I want a bulk action confirmation modal so that destructive communications are not sent accidentally. | P1 | M | 📋 Planned |
| US-08-07 | As an admin, I want server-side search on the member list so that searches remain fast as membership grows. | P1 | M | 📋 Planned |

---

### Feature: F-08-2 — Admin User Management

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-08 | As a super admin, I want to view all platform admins and their roles so that I can audit who has elevated access. | P0 | M | ✅ Done |
| US-08-09 | As a super admin, I want to assign and revoke admin roles so that access is controlled as staff changes. | P0 | M | ✅ Done |

---

### Feature: F-08-3 — Operational Pipelines (Service / Partnership / Collaboration)

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-10 | As an admin, I want to view all inbound service requests with their status and type so that I can triage and respond. | P0 | M | ✅ Done |
| US-08-11 | As an admin, I want to view all partnership leads and update their status so that I can track relationship progress. | P0 | M | ✅ Done |
| US-08-12 | As an admin, I want to view all collaboration leads and update their status so that I can manage collaborative opportunities. | P0 | M | ✅ Done |
| US-08-13 | As an admin, I want to delete a pipeline record (service request, lead) so that I can remove spam or duplicate submissions. | P1 | S | 📋 Planned |
| US-08-14 | As an admin, I want to sort pipeline tables by column so that I can order items by date, status, or type. | P2 | M | 🔲 Backlog |
| US-08-15 | As an admin, I want badge counts on pipeline nav items showing new/unactioned items so that I can see at a glance where attention is needed. | P2 | S | 🔲 Backlog |
| US-08-16 | As an admin, I want all admin pipeline pages to use the translation function (i18n) consistently so that the admin interface is fully localisable. | P2 | M | 📋 Planned |

---

### Feature: F-08-4 — Admin UI Consistency & Accessibility

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-17 | As an admin, I want consistent search placement in all admin toolbars so that I always know where to look. | P1 | M | ✅ Done |
| US-08-18 | As an admin, I want filter tabs consolidated into a single row so that the interface is less cluttered and more scannable. | P1 | M | ✅ Done |
| US-08-19 | As an admin, I want clear visual feedback during form submissions (loading spinners, success, error) so that I know whether my action succeeded. | P1 | M | 📋 Planned |
| US-08-20 | As an admin, I want skeleton loading states on data tables so that long data fetches feel responsive. | P2 | M | 🔲 Backlog |
| US-08-21 | As an admin, I want sticky table headers when scrolling long lists so that column labels remain visible. | P2 | S | 🔲 Backlog |
| US-08-22 | As an admin, I want keyboard shortcuts for common actions so that power users can navigate without the mouse. | P3 | L | 🔲 Backlog |

---

## EP-09: PATNA AI Assistant

**Goal:** Provide members and admins with an intelligent, context-aware assistant that can query PATNA's knowledge base (discussions, publications, events, insights) while fully respecting role-based access controls.
**Shipped:** April 2026 (admin-facing); member rollout in progress.
**Overall Status:** ⚙️ In Progress

---

### Feature: F-09-1 — RAG-Powered Chat Interface

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-09-01 | As a member, I want to open the PATNA Assistant and ask questions about community discussions, events, and publications so that I can quickly synthesise knowledge without searching manually. | P0 | XL | ✅ Done |
| US-09-02 | As a member, I want suggested prompts in the assistant so that I know what kinds of questions are useful to ask. | P1 | S | ✅ Done |
| US-09-03 | As a member, I want a typing indicator while the assistant is generating a response so that I know the system is working. | P1 | S | ✅ Done |
| US-09-04 | As a member, I want the assistant to only surface content I am permitted to see so that restricted or admin-only data is never exposed. | P0 | L | ✅ Done |
| US-09-05 | As a member, I want to see the access scopes my assistant queries are running against so that I understand the context and limits of its knowledge. | P2 | M | 📋 Planned |

---

### Feature: F-09-2 — Document Indexing & Drive Sync

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-09-06 | As an admin, I want to add Google Drive folders as knowledge sources so that the assistant can draw on PATNA's shared document library. | P0 | L | ✅ Done |
| US-09-07 | As an admin, I want to trigger a sync of Drive sources so that newly uploaded documents are reflected in the assistant's knowledge. | P0 | M | ✅ Done |
| US-09-08 | As an admin, I want to see Drive sync progress and error status so that I can diagnose issues without checking logs. | P1 | M | ✅ Done |
| US-09-09 | As an admin, I want Drive sync to handle folders with more than 100 items so that large document libraries are fully indexed. | P0 | M | ✅ Done |
| US-09-10 | As an admin, I want publications to be automatically indexed for the assistant when published so that new content is immediately searchable. | P1 | M | ✅ Done |

---

### Feature: F-09-3 — Agentic Tools & Quality

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-09-11 | As a member, I want the assistant to use structured tools (lookup members, find events, retrieve publications) so that responses are grounded in live platform data rather than embeddings alone. | P1 | XL | ✅ Done |
| US-09-12 | As an admin, I want audit logs of all assistant queries so that I can monitor for misuse or policy violations. | P1 | L | 📋 Planned |
| US-09-13 | As a member, I want the assistant to cite which documents or threads it drew from so that I can verify the source of its answer. | P2 | L | 📋 Planned |
| US-09-14 | As an admin, I want to rate-limit assistant queries per user so that no single user can degrade performance for others. | P2 | M | 🔲 Backlog |
| US-09-15 | As an admin, I want an assistant quality dashboard showing query volume, latency, and user ratings so that I can monitor and improve response quality over time. | P3 | XL | 🔲 Backlog |

---

## EP-10: Platform Hardening

**Goal:** Harden the platform with notifications, security improvements, multilingual parity, accessibility, and performance — raising the baseline quality across all surfaces.
**Status:** 📋 Planned / 🔲 Backlog

---

### Feature: F-10-1 — Notification System

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-01 | As a member, I want to receive email digests of activity in my spaces so that I stay informed without checking the platform daily. | P1 | XL | 🔲 Backlog |
| US-10-02 | As a member, I want to receive an in-app notification when someone mentions me in a thread so that I can respond promptly. | P1 | L | 🔲 Backlog |
| US-10-03 | As a member, I want to manage my notification preferences (frequency, types, channels) so that I receive only what is relevant to me. | P1 | L | 🔲 Backlog |
| US-10-04 | As an admin, I want to send targeted notifications to selected members so that I can broadcast important announcements to specific cohorts. | P1 | L | 🔲 Backlog |

---

### Feature: F-10-2 — Security Improvements

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-05 | As a member, I want to enable two-factor authentication so that my account is protected beyond just a password. | P1 | L | 📋 Planned |
| US-10-06 | As a member, I want to view and manage active sessions so that I can revoke access if a device is lost or compromised. | P2 | M | 🔲 Backlog |
| US-10-07 | As an admin, I want all assistant queries to be logged with user ID and timestamp so that I have an audit trail for compliance purposes. | P1 | M | 📋 Planned |

---

### Feature: F-10-3 — Multilingual & i18n Parity

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-08 | As a member, I want to switch the interface language and have all admin and member pages rendered in that language so that non-English speakers can use the platform comfortably. | P1 | XL | ⚙️ In Progress |
| US-10-09 | As an editor, I want to publish content in multiple languages so that PATNA's knowledge output reaches a broader audience. | P2 | XL | 🔲 Backlog |
| US-10-10 | As an admin, I want all admin pipeline pages (service requests, partnership leads, collaboration leads) to use the translation function so that they are fully localisable. | P2 | M | 📋 Planned |

---

### Feature: F-10-4 — Accessibility & UX Polish

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-11 | As a visually impaired user, I want all form inputs to have explicit labels so that screen readers can interpret the interface correctly. | P1 | M | 📋 Planned |
| US-10-12 | As an admin, I want filter tabs to be fully keyboard-navigable so that the admin interface is accessible without a mouse. | P1 | M | 📋 Planned |
| US-10-13 | As a member on a small screen, I want all tables and forms to adapt to mobile widths so that the platform is usable on a phone. | P1 | L | ⚙️ In Progress |
| US-10-14 | As a user, I want a dark mode option so that the platform is comfortable to use in low-light environments. | P3 | L | 🔲 Backlog |

---

### Feature: F-10-5 — Performance & Developer Experience

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-15 | As a developer, I want the pnpm and Node version enforced via corepack and `.nvmrc` so that environment differences don't cause build failures. | P1 | S | ✅ Done |
| US-10-16 | As a developer, I want a consistent branching strategy (feat/, fix/, hotfix/, chore/) documented and enforced via PR template so that the codebase history is clean and navigable. | P1 | S | ✅ Done |
| US-10-17 | As an admin, I want CSV exports of large member lists to include a progress indicator so that I know a long-running export has not stalled. | P2 | M | 🔲 Backlog |
| US-10-18 | As a developer, I want a lint rule that flags hardcoded strings in page components so that i18n gaps are caught at development time rather than discovered in production. | P2 | M | 🔲 Backlog |

---

## Backlog Summary

### By Status

| Status | Story Count |
|---|---|
| ✅ Done | 82 |
| ⚙️ In Progress | 4 |
| 📋 Planned | 19 |
| 🔲 Backlog | 23 |
| **Total** | **128** |

### Priority Backlog (Planned + Backlog, P0–P1 only)

| Story ID | Summary | Epic | Priority |
|---|---|---|---|
| US-03-08 | Server-side member directory search | EP-03 | P1 |
| US-03-14 | Thread reply notifications | EP-03 | P1 |
| US-03-18 | Two-factor authentication | EP-03 | P1 |
| US-04-12 | Booking confirmation emails | EP-04 | P1 |
| US-08-06 | Bulk action confirmation modal | EP-08 | P1 |
| US-08-07 | Server-side admin member search | EP-08 | P1 |
| US-08-13 | Delete pipeline records | EP-08 | P1 |
| US-08-16 | i18n for pipeline pages | EP-08 | P2 |
| US-08-19 | Loading states on form submissions | EP-08 | P1 |
| US-09-05 | Assistant access scope visualisation | EP-09 | P2 |
| US-09-12 | Assistant query audit logs | EP-09 | P1 |
| US-09-13 | Assistant source citations | EP-09 | P2 |
| US-10-01 | Email digest notifications | EP-10 | P1 |
| US-10-02 | In-app @mention notifications | EP-10 | P1 |
| US-10-03 | Member notification preferences | EP-10 | P1 |
| US-10-04 | Admin broadcast notifications | EP-10 | P1 |
| US-10-05 | Two-factor authentication | EP-10 | P1 |
| US-10-07 | Assistant query audit trail | EP-10 | P1 |
| US-10-10 | i18n parity for pipeline admin | EP-10 | P2 |
| US-10-11 | Screen-reader labels for form inputs | EP-10 | P1 |
| US-10-12 | Keyboard navigation for filter tabs | EP-10 | P1 |

---

## Delivery Timeline (Gantt View)

```
                           MAR   APR   MAY   JUN   JUL   AUG   SEP   OCT   NOV   DEC
                           2026  2026  2026  2026  2026  2026  2026  2026  2026  2026
EP-01 Public Platform      ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-02 Auth & Onboarding    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-03 Member Workspace     ████████░░⚙⚙░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-04 Calendar & Booking   ░░░░████⚙⚙░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-05 Content & Pubs       ░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-06 Events               ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-07 Projects & KG        ░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-08 Admin Hub            ████████████⚙⚙░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-09 AI Assistant         ░░░░░░░░████⚙⚙░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
EP-10 Hardening            ░░░░░░░░░░░░░░░░████████████████████████████████████████

Legend: ████ = Shipped  ⚙⚙ = In Progress  ░░░░ = Planned/Backlog
```

---

## Change Log

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | May 2026 | Product Team | Initial document generated from codebase and planning review |
