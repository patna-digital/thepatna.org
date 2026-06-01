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
| [EP-10](#ep-10-platform-hardening) | Platform Hardening | ⚙️ In Progress |

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
| US-01-10i | As a potential partner, I want to fill in a web form (not just email) on the Partnership page so that my enquiry is captured in the admin pipeline immediately. | P1 | M | ✅ Done |
| US-01-11i | As an organisation requesting support, I want to fill in a structured web form so that PATNA receives all the context they need to triage and respond. | P1 | M | ✅ Done |
| US-01-12i | As a collaborator, I want to submit my proposal via a web form so that the PATNA team can review and track it without relying on email. | P1 | M | ✅ Done |

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

### Feature: F-01-5 — Homepage Section Redesign & Copy Refresh

Based on the May 2026 site audit (PATNA Website Copy Recommendations v1.0).

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-01-16 | As a visitor, I want to see PATNA's Vision and Mission statements alongside Our Story narrative on the homepage, accompanied by a group photo, so that I immediately understand what the organisation stands for and why it was founded. | P1 | M | ✅ Done |
| US-01-17 | As a visitor, I want a clean stats band showing 100+ member network, 25 countries, 4 expert cohorts, and 3 flagship programmes so that PATNA's scale is communicated with clarity and credibility. | P1 | S | ✅ Done |
| US-01-18 | As a visitor, I want to see PATNA's four expert cohorts presented as individual cards with icons and descriptions so that I understand the professional disciplines that make up the network before reaching the member cards. | P1 | M | ✅ Done |
| US-01-19 | As a visitor, I want the LEAP Phase III project card to display as "LEAP Phase III" (not "LEAP Phase III / ORCA Africa 2026") so that project naming is consistent with Phases I and II. | P2 | S | ✅ Done |

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

### Feature: F-02-4 — Admin & Partner Onboarding

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-02-14 | As a newly appointed admin, I want to receive a welcome email when the super admin grants my role so that I know immediately and have a direct link to the admin workspace. | P1 | S | ✅ Done |
| US-02-15 | As an admin, I want the platform to support distinct onboarding flows for members (invite), admins (super admin grant + welcome email), and partners (admin-added or website form) so that each user type receives an appropriate welcome experience. | P1 | M | ✅ Done |

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
| US-03-17 | As a member, I want to manage notification preferences (email digest, mention alerts) so that I receive only the communications I want. | P2 | L | ✅ Done |
| US-03-18 | As a member, I want to enable two-factor authentication so that my account is protected against unauthorised access. | P1 | L | 📋 Planned |
| US-03-19 | As a member, I want to view an activity log of my recent actions so that I can audit my own engagement on the platform. | P3 | M | 🔲 Backlog |
| US-03-20 | As a member, I want to see a breakdown of what information is visible under each directory visibility setting so that I can make an informed privacy choice. | P2 | S | ✅ Done |
| US-03-21 | As a member, I want to navigate directly from the availability status setting to the availability schedule editor so that setup flows naturally without hunting through menus. | P2 | S | ✅ Done |

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
| US-04-15 | As a member, I want the Calendar Sync page (formerly Calendar Settings) to be clearly named and include a direct "View Calendar" link so that the onboarding flow from availability → calendar sync → calendar view is seamless. | P2 | S | ✅ Done |

---

## EP-05: Content & Publications

**Goal:** Provide a structured content library — insights, reports, briefings, and publications — that members and the public can discover and download.
**Shipped:** April–June 2026
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

### Feature: F-05-4 — Legacy Publications Migration & Admin Controls

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-05-13 | As a developer, I want 14 legacy publications from the decommissioned PATNA website seeded into the database with canonical dates, real summaries, SEO meta descriptions, cover images, and PDF attachment links so that the content library is complete from day one without manual re-entry. | P0 | M | ✅ Done |
| US-05-14 | As an admin, I want to edit the publication date (published_at) directly from the admin insight form so that backdated or migrated publications display the correct original date on the site. | P1 | S | ✅ Done |
| US-05-15 | As an admin, I want to flag a publication as "needs review" so that I can track which migrated or draft publications still require content fixes, and be alerted via a badge on the Publications nav item. | P1 | S | ✅ Done |
| US-05-16 | As a visitor or member, I want breadcrumb navigation (Home › Publications › Title) and prev/next publication links on every publication detail page so that I can navigate the publications library seamlessly without returning to the index. | P1 | M | ✅ Done |

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
| US-08-06 | As an admin, I want a bulk action confirmation modal so that destructive communications are not sent accidentally. | P1 | M | ✅ Done |
| US-08-07 | As an admin, I want server-side search on the member list so that searches remain fast as membership grows. | P1 | M | ✅ Done |

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
| US-08-13 | As an admin, I want to delete a pipeline record (service request, lead) so that I can remove spam or duplicate submissions. | P1 | S | ✅ Done |
| US-08-14 | As an admin, I want to sort pipeline tables by column so that I can order items by date, status, or type. | P2 | M | ✅ Done |
| US-08-15 | As an admin, I want badge counts on pipeline nav items showing new/unactioned items so that I can see at a glance where attention is needed. | P2 | S | ✅ Done |
| US-08-16 | As an admin, I want all admin pipeline pages to use the translation function (i18n) consistently so that the admin interface is fully localisable. | P2 | M | ✅ Done |

---

### Feature: F-08-4 — Admin UI Consistency & Accessibility

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-17 | As an admin, I want consistent search placement in all admin toolbars so that I always know where to look. | P1 | M | ✅ Done |
| US-08-18 | As an admin, I want filter tabs consolidated into a single row so that the interface is less cluttered and more scannable. | P1 | M | ✅ Done |
| US-08-19 | As an admin, I want clear visual feedback during form submissions (loading spinners, success, error) so that I know whether my action succeeded. | P1 | M | ✅ Done |
| US-08-20 | As an admin, I want skeleton loading states on data tables so that long data fetches feel responsive. | P2 | M | ✅ Done |
| US-08-21 | As an admin, I want sticky table headers when scrolling long lists so that column labels remain visible. | P2 | S | ✅ Done |
| US-08-22 | As an admin, I want keyboard shortcuts for common actions so that power users can navigate without the mouse. | P3 | L | ✅ Done |

---

### Feature: F-08-5 — Application Task Assignment

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-23 | As an admin, I want to assign an application review task to another admin so that work is distributed and no application sits unreviewed. | P1 | M | ✅ Done |
| US-08-24 | As an assigned admin, I want to receive an in-app notification and email when an application is assigned to me so that I can act immediately without checking the queue manually. | P1 | S | ✅ Done |
| US-08-25 | As an admin, I want to add assignment notes when delegating a review so that the assignee has full context without needing to ask. | P2 | S | ✅ Done |
| US-08-26 | As an admin, I want to assign an applicant to multiple cohorts (specifying the primary cohort) so that interdisciplinary members are correctly placed across the community. | P1 | M | ✅ Done |

---

### Feature: F-08-8 — Partnership Leads Consolidation & UX

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-40 | As an admin, I want a consolidated Leads page that shows all service requests, partnership leads, and collaboration leads in one unified table so that I don't need to navigate three separate pipelines. | P1 | M | ✅ Done |
| US-08-41 | As an admin, I want each lead row to prominently show the contact person (name + email from the website form submission) so that I immediately know who submitted the enquiry. | P1 | S | ✅ Done |
| US-08-42 | As an admin, I want to filter the Leads list by source type (Service / Partnership / Collaboration), status, and free-text search so that I can quickly find specific leads. | P1 | M | ✅ Done |
| US-08-43 | As an admin, I want to assign a lead to another admin staff member from the lead detail page, with a dropdown showing all admin users and their role titles, so that work is distributed and accountability is clear. | P1 | M | ✅ Done |
| US-08-44 | As an admin, I want a sidebar contact card on every lead detail page showing the submitter's name, email (as a mailto link), organisation, and lead type so that I can act on the enquiry without scrolling through the edit form. | P2 | S | ✅ Done |
| US-08-45 | As an admin, I want lead form pages (/new and /edit) to have proper page chrome (DashboardShell, breadcrumb, cancel → /admin/leads) so that they feel integrated rather than orphaned bare forms. | P1 | M | ✅ Done |
| US-08-46 | As an admin, I want human-readable status labels in the Leads table (e.g. "In Discussion", "Won", "Closed") instead of raw database values so that status is immediately interpretable. | P2 | S | ✅ Done |
| US-08-47 | As an admin, I want delete actions on leads and service requests to redirect to /admin/leads so that I land on the correct page after removal. | P1 | S | ✅ Done |

---

### Feature: F-08-9 — Admin Shell & Navigation Refresh

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-48 | As an admin, I want breadcrumb navigation (Admin › Section › Page) on all admin pages so that I always know where I am and can navigate back without using the browser back button. | P2 | M | ✅ Done |
| US-08-49 | As an admin, I want the "Navigate across PATNA" cross-navigation footer and sidebar cross-nav removed from admin pages so that the interface is cleaner and less cluttered. | P2 | S | ✅ Done |
| US-08-50 | As an admin, I want the admin nav Partnerships group to show only Partners and Leads (not three separate pipeline pages), and Website to appear under Tools, so that the nav is simpler and better organised. | P2 | M | ✅ Done |
| US-08-51 | As an admin, I want the Website settings page to have collapsible sections for Community Snapshot, Featured Partners, and People — collapsed by default showing a summary — so that the page is scannable and I expand only what I need. | P2 | M | ✅ Done |
| US-08-52 | As an admin, I want to manage People profiles inline on the Website settings page (section tabs, reorder buttons, edit links) without navigating to a separate People admin page. | P2 | M | ✅ Done |
| US-08-53 | As an admin, I want to toggle which partners are featured on the home page from the Website settings page (with a checkbox list and single Save button) so that I can control homepage visibility without editing each partner record individually. | P2 | S | ✅ Done |

---

### Feature: F-08-6 — Partner Registry

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-27 | As an admin, I want to view all confirmed partners in a registry with tabs for each partnership pathway (institutional, collaboration, service) so that I can quickly navigate the partner landscape. | P1 | M | ✅ Done |
| US-08-28 | As an admin, I want to add a new partner with full profile information (name, type, country, description, website, pathway, status, notes) so that the registry is comprehensive and accurate. | P1 | M | ✅ Done |
| US-08-29 | As an admin, I want to upload and crop a partner logo to a fixed display ratio so that all logos look consistent across the site. | P2 | M | ✅ Done |
| US-08-30 | As an admin, I want to add one or more contact persons to a partner record, marking a primary contact, so that we always know who to reach within each organisation. | P1 | M | ✅ Done |
| US-08-31 | As an admin, I want to feature selected partners on the home page so that high-profile relationships are visible to site visitors without a code change. | P2 | S | ✅ Done |
| US-08-32 | As a developer, I want the 16 existing PATNA partners seeded into the partner database on migration so that the registry is populated from day one. | P1 | S | ✅ Done |

---

### Feature: F-08-7 — Website People Profiles (Admin-Managed)

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-08-33 | As an admin, I want to manage Board of Directors, Secretariat, and Research Contributor profiles in the admin workspace so that the About page always reflects current and accurate people data. | P1 | M | ✅ Done |
| US-08-34 | As an admin, I want to upload and crop a square profile photo for each person so that About page headshots look polished and consistent. | P1 | M | ✅ Done |
| US-08-35 | As an admin, I want to add a LinkedIn URL to each profile so that visitors can connect directly with board members and researchers. | P2 | S | ✅ Done |
| US-08-36 | As an admin, I want to control display order and visibility of each profile so that I can show or hide people without deleting their data. | P1 | S | ✅ Done |
| US-08-37 | As an admin, I want profile records to exist independently of member accounts so that external board members and UCL researchers can be managed without being platform members. | P1 | S | ✅ Done |
| US-08-38 | As a developer, I want existing Board, Secretariat, and Research Leadership data seeded from the website on migration so that no manual re-entry is required. | P1 | S | ✅ Done |
| US-08-39 | As a visitor, I want the About page to display live DB content with graceful static fallback so that the page never breaks even before the migration runs. | P1 | S | ✅ Done |
| US-10-20 | As a member, I want the notification bell removed from the sidebar (it is already in the page header) so that the UI is uncluttered and the bell is in a consistent position across all pages. | P2 | S | ✅ Done |

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
**Status:** ⚙️ In Progress

---

### Feature: F-10-1 — Notification System

| Story ID | User Story | Priority | Estimate | Status |
|---|---|---|---|---|
| US-10-01 | As a member, I want to receive email digests of activity in my spaces so that I stay informed without checking the platform daily. | P1 | XL | ✅ Done |
| US-10-02 | As a member, I want to receive an in-app notification when someone mentions me in a thread so that I can respond promptly. | P1 | L | ✅ Done |
| US-10-03 | As a member, I want to manage my notification preferences (frequency, types, channels) so that I receive only what is relevant to me. | P1 | L | ✅ Done |
| US-10-04 | As an admin, I want to send targeted notifications to selected members so that I can broadcast important announcements to specific cohorts. | P1 | L | ✅ Done |
| US-10-19 | As a member, I want the notification bell to be visible at the top of every member page on desktop (not just in the sidebar footer) so that it matches the mobile experience and is easy to find. | P2 | S | ✅ Done |

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
| US-10-08 | As a member, I want to switch the interface language and have all admin and member pages rendered in that language so that non-English speakers can use the platform comfortably. | P1 | XL | ✅ Done |
| US-10-09 | As an editor, I want to publish content in multiple languages so that PATNA's knowledge output reaches a broader audience. | P2 | XL | 🔲 Backlog |
| US-10-10 | As an admin, I want all admin pipeline pages (service requests, partnership leads, collaboration leads) to use the translation function so that they are fully localisable. | P2 | M | ✅ Done |

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
| ✅ Done | 114 |
| ⚙️ In Progress | 3 |
| 📋 Planned | 14 |
| 🔲 Backlog | 23 |
| **Total** | **154** |

### Priority Backlog (Planned + Backlog, P0–P1 only)

| Story ID | Summary | Epic | Priority |
|---|---|---|---|
| US-03-08 | Server-side member directory search | EP-03 | P1 |
| US-03-14 | Thread reply notifications | EP-03 | P1 |
| US-03-18 | Two-factor authentication | EP-03 | P1 |
| US-04-12 | Booking confirmation emails | EP-04 | P1 |
| US-08-06 | Bulk action confirmation modal | EP-08 | P1 |
| US-08-07 | Server-side admin member search | EP-08 | P1 |
| US-09-05 | Assistant access scope visualisation | EP-09 | P2 |
| US-09-12 | Assistant query audit logs | EP-09 | P1 |
| US-09-13 | Assistant source citations | EP-09 | P2 |
| US-10-05 | Two-factor authentication | EP-10 | P1 |
| US-10-07 | Assistant query audit trail | EP-10 | P1 |
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
| 1.1 | May 2026 | Engineering | Completed F-08-3: delete, column sort, badge counts, i18n in pipeline tables; added detail/edit pages for partnership and collaboration leads; replaced mailto links with structured web forms on all three /work-with-us pages (F-01-2 improvement) |
| 1.2 | Jun 2026 | Engineering | Added F-08-8 (Partnership Leads Consolidation): unified /admin/leads page replacing 3 separate pipelines; contact person column; source/status filters; real admin assignment dropdown (lib/admin-users.js); improved detail page sidebar with contact card; fixed /new pages missing DashboardShell and hardcoded notice bug; all delete/cancel redirects → /admin/leads. Added F-08-9 (Admin Shell & Nav Refresh): breadcrumb nav on all admin pages; removed "Navigate across PATNA" cross-nav footer; Partnerships nav = Partners + Leads; Website under Tools with collapsible sections (Community Snapshot, Featured Partners, People inline); featured partners toggle; ServiceRequestForm useFormStatus bug fixed. |
| 1.3 | Jun 2026 | Engineering | Added F-05-4 (Legacy Publications Migration & Admin Controls — US-05-13–16): migration 0057 seeds 14 legacy publications from decommissioned thepatna.org/resources with canonical published_at dates, real summaries, SEO meta descriptions, external cover images, and PDF attachment links; ON CONFLICT strategy preserves manually edited data while filling empty fields; needs_review boolean column added — all seeded records flagged for admin follow-up; admin nav badge counts flagged publications; insight-form exposes editable published_at (datetime-local) and needs_review checkbox with warning styling. Added breadcrumb trail (Home › Publications › Title) and prev/next navigation on both the marketing and community app publication detail pages. Updated homepage hero video to latest version from Supabase storage. Cleaned up priority backlog table — removed stale Done entries (US-10-01–04, US-10-10, US-08-19). Story count: 110 Done (+4), 150 total (+4). |
| 1.4 | Jun 2026 | Engineering | Added F-01-5 (Homepage Section Redesign & Copy Refresh — US-01-16–19): removed 3-pillar Value Prop section; replaced About section with Vision/Mission tag rows, Our Story paragraph, and group photo slot (two-column layout); added standalone Stats band (100+ member network · 25 countries · 4 expert cohorts · 3 flagship programmes); added dedicated 4-card Cohorts section with inline SVG icons; removed cohort pills from Community snapshot section; updated en.json with copy from May 2026 site audit; removed "ORCA Africa 2026" from LEAP Phase III name and Dr Oluteye bio for naming consistency. Full responsive CSS (1024/900/600px). Story count: 114 Done (+4), 154 total (+4). |
