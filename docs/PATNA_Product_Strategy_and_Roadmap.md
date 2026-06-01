# PATNA Platform — Product Strategy & Roadmap

**Version:** 1.0
**Date:** May 2026
**Status:** Living Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Target Personas](#3-target-personas)
4. [Product Surfaces](#4-product-surfaces)
5. [Strategic Phases](#5-strategic-phases)
6. [Platform Maturity Summary](#6-platform-maturity-summary)
7. [Technical Foundation](#7-technical-foundation)
8. [Key Strategic Decisions](#8-key-strategic-decisions)
9. [Metrics & Success Criteria](#9-metrics--success-criteria)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Horizon Opportunities](#11-horizon-opportunities)

---

## 1. Executive Summary

PATNA is a multi-surface digital platform serving as the operational and intellectual home for a community of policy researchers, practitioners, and advocates. The platform has three distinct surfaces: a **public-facing marketing and publishing site**, a **members-only collaboration workspace**, and an **admin operations hub** for content governance and community management.

Development began on 29 March 2026. In eight weeks of active delivery, the platform has shipped approximately 46 pull requests and progressed through three of four planned foundational phases. The public website, member workspace, admin hub, and AI assistant are all live or substantially complete. Calendar/booking integration and multilingual support are partially shipped. A structured backlog of hardening and enhancement work follows.

**Current platform status (as of May 2026):**

| Surface | Status |
|---|---|
| Public Website | Live |
| Member Workspace | Live |
| Admin Operations Hub | Live |
| AI Assistant (PATNA Assistant) | Live (admin-facing, member rollout in progress) |
| Calendar & Booking | Live |
| Multilingual (i18n) | Partial — infrastructure in place, full content rollout pending |
| Notifications | Backlog |
| Mobile Application | Horizon |

---

## 2. Product Vision & Mission

### Vision

To be the definitive digital home for the PATNA community — a place where policy knowledge is created, shared, and acted upon, and where members build meaningful professional relationships across cohorts, geographies, and disciplines.

### Mission

Build a platform that connects PATNA's global community of policy professionals through a shared workspace for knowledge, collaboration, and coordination — governed with care, powered by modern infrastructure, and designed to grow with the organisation.

### Product Principles

| Principle | Description |
|---|---|
| **Community first** | Every feature serves the member experience before it serves the operator. |
| **Role-aware by default** | Access, visibility, and data are scoped to what each role is permitted to see. |
| **One source of truth** | All structured content and community data lives in Supabase; no split ownership with spreadsheets or secondary CMS. |
| **Incremental delivery** | Ship working software frequently; avoid long-lived feature branches. |
| **Security by design** | RLS policies and server-side auth checks are non-negotiable; they are applied before any feature ships. |
| **Accessible and internationalised** | The platform should work for all members regardless of language or ability. |

---

## 3. Target Personas

### P1 — Community Member (Primary)

Policy researchers, analysts, and practitioners accepted into the PATNA community. They attend events, consume and contribute content, participate in cohort-specific discussions, and use the platform to connect with peers.

**Key needs:** Discover relevant knowledge, connect with other members, stay current on events, manage their profile and availability, and access AI-assisted summaries of community discussions.

### P2 — Cohort Lead

Senior members responsible for guiding a specific cohort (e.g., Academic, Policy). They have elevated visibility into their cohort's content and member activity.

**Key needs:** Monitor cohort engagement, communicate with cohort members, moderate spaces, and curate cohort-relevant content.

### P3 — Admin / Editor

PATNA staff managing the day-to-day operations of the platform: reviewing applications, publishing content, managing events, and operating pipelines for service requests and partnership leads.

**Key needs:** Efficiently review and action applications, publish and schedule content, manage events end-to-end, and track operational pipeline items.

### P4 — Public Visitor

Researchers, funders, partners, and interested professionals who are not yet members. They discover PATNA through the public website and may apply for membership or initiate a partnership or service request.

**Key needs:** Understand what PATNA does, discover published work and events, and take a clear action (apply, partner, contact).

---

## 4. Product Surfaces

### 4.1 Public Website

The externally-facing marketing and publishing surface. It introduces PATNA to the world, publishes its knowledge output, and converts visitors into applicants or partners.

**Routes:** `/`, `/about`, `/projects`, `/publications`, `/events`, `/insights`, `/community`, `/work-with-us`, `/contact`, `/legal`

**Key capabilities:**
- Homepage with programme pillars, statistics, partner marquee, and community snapshot
- About page with PATNA's story, LEAP phases, governance, and board profiles
- Projects catalogue with workstreams, activities, geographic footprint, and knowledge graph
- Publications library with file-based reader
- Events calendar with detailed event pages
- Work With Us portal: service requests, collaboration leads, partnership applications
- Legal pages: Privacy Policy and Terms of Service

### 4.2 Member Workspace

The authenticated, members-only collaboration environment.

**Routes:** `/app/*`

**Key capabilities:**
- Invite-based onboarding: application → approval → invite token → account creation → profile completion
- Member profiles with headshots, résumés, compliance documents (NDA, Code of Conduct), availability status, and visibility settings
- Member directory with search and filter by cohort, domain, and availability
- Spaces: cohort rooms, constituencies, working groups, and geography-based groups
- Discussion threads and comments within spaces
- Events view with member RSVP and event submission
- Publications reader with attachment downloads
- Calendar integration: connect Google, Microsoft, Zoho, Apple, or iCal accounts
- Public booking page per member (availability rules, time slots, meeting conferencing)
- PATNA AI Assistant: context-aware chat with role-scoped knowledge retrieval
- Settings: visibility, availability status, password management

### 4.3 Admin Operations Hub

The staff-facing interface for governance, content management, and operational pipelines.

**Routes:** `/admin/*`

**Key capabilities:**
- Overview dashboard with summary metrics and quick-action tiles
- Applications management: review, approve, reject, issue invites
- Member management: search, filter by cohort/role/status, bulk actions, send communications, export CSV
- Admin user management: assign and revoke admin roles
- Events management: create, edit, publish, schedule, review member submissions
- Content (Insights) management: create and publish blog posts, reports, and briefings
- Projects management: full CRUD with workstreams, activities, geography, and related content
- Spaces administration: create, moderate, manage membership
- Service requests, collaboration leads, and partnership leads pipelines
- AI Assistant admin panel: Drive source management, document indexing, sync status

---

## 5. Strategic Phases

### Phase 1 — Public Platform ✅ Shipped (March 2026)

Objective: Establish PATNA's digital presence with a polished public-facing website that introduces the organisation, showcases its work, and enables inbound inquiries.

Delivered:
- Full marketing site with all public routes
- Content model for insights, projects, events, and publications
- Work-with-us intake forms (service requests, partnership leads, collaboration leads)
- Contact form
- Privacy Policy and Terms of Service
- Vercel deployment with preview environments

### Phase 2 — Member Platform ✅ Shipped (March–April 2026)

Objective: Deliver an authenticated, community-grade workspace for members to collaborate, discover knowledge, and manage their professional profiles.

Delivered:
- Supabase Auth with invite-based onboarding flow
- Member profiles (headshots, résumés, NDA, Code of Conduct)
- Member directory with search and cohort filtering
- Spaces, threads, and comments
- Events view and member event submissions
- Publication reader with file downloads
- Member settings (visibility, availability)
- Role-based access control with RLS policies

### Phase 3 — Admin Operations ✅ Shipped (March–May 2026)

Objective: Equip PATNA staff with the tools to govern membership, publish content, and manage operational pipelines efficiently.

Delivered:
- Admin overview dashboard
- Applications review and invite issuance
- Member management with bulk actions and export
- Admin user management
- Events management (create, publish, schedule, review submissions)
- Content/insights management
- Projects management with full hierarchy
- Spaces administration
- Service requests, partnership leads, and collaboration leads pipelines
- Community admin UI/UX consistency pass (search, filters, button hierarchy)

### Phase 4 — AI, Multilingual & Booking ⚙️ Partially Shipped (April–May 2026)

Objective: Layer intelligence and global reach onto the platform — an AI assistant for knowledge discovery, multilingual content support, and a booking system for member availability.

**Shipped:**
- PATNA AI Assistant (RAG-powered with Claude) — agentic tool use, document embeddings, role-scoped retrieval
- Google Drive sync for assistant knowledge sources
- Multi-provider calendar integration (Google, Microsoft, Zoho, Apple, iCal)
- Availability rules and public booking pages
- i18n infrastructure (next-intl) and Google-backed translation layer
- Cohort bulk import migration scripts

**In Progress / Backlog:**
- Member-facing AI assistant deployment (currently admin-only)
- Full multilingual content coverage across all public pages
- AI query audit logging for compliance
- Assistant access scope visualisation (member-facing)

### Phase 5 — Horizon (Q3–Q4 2026 and beyond) 📋 Planned

Objective: Extend platform reach, deepen engagement analytics, and open integration pathways.

Planned:
- Native mobile application (React Native or progressive web app)
- Advanced analytics dashboard for admins (member engagement, content reach, event attendance trends)
- Open API / developer integration layer for partner systems
- Notification system (email digest, in-app alerts, discussion mentions)
- Two-factor authentication (2FA)
- Dark mode
- Customisable admin column views
- Sticky table headers and keyboard shortcuts for admin power users

---

## 6. Platform Maturity Summary

| Feature Area | Completion | Notes |
|---|---|---|
| Public marketing site | 100% | All routes live; May 2026 UI refresh complete |
| Authentication (invite flow, auth, session) | 100% | Supabase Auth + RLS; hotfixes shipped |
| Member profiles & onboarding | 95% | NDA/CoC, résumé, headshots live; profile status admin-side only |
| Member directory | 95% | Search, cohort filter, modal; server-side search improvements in backlog |
| Spaces & discussions | 90% | Create, join, thread, comment live; advanced moderation in backlog |
| Events (public + member + admin) | 95% | CRUD, submissions, RSVP, gallery; bulk actions backlog |
| Projects & knowledge graph | 90% | Hierarchy, workstreams, geography, relationships live; map visualisation in backlog |
| Publications | 95% | Reader, attachments, admin CRUD live |
| Calendar & booking | 85% | Multi-provider sync live; Apple/iCal writeback partial; booking edge cases in backlog |
| AI Assistant | 75% | Admin-facing fully live; member deployment and audit logging in backlog |
| Content/insights management | 95% | Full admin CRUD live; translation and gallery finalisation in backlog |
| Admin pipelines (service/partner/collab) | 80% | List, view, create live; delete implementation and i18n in backlog |
| i18n / multilingual | 50% | Infrastructure in place; full content coverage backlog |
| Settings (member) | 80% | Visibility and availability editable; notifications and 2FA are backlog |
| Notifications | 0% | Backlog (schema not started) |
| Dark mode | 0% | Backlog |
| Mobile app | 0% | Horizon |

---

## 7. Technical Foundation

### Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 15+ (App Router) | Server Components, file-based routing, Vercel-optimised |
| Backend / database | Supabase (PostgreSQL 14) | Auth, RLS, storage, edge functions — all in one |
| Hosting | Vercel | Preview deployments per branch; Vercel Cron for scheduled jobs |
| AI | Anthropic Claude (claude-sonnet-4-6) with RAG | Context-aware, role-scoped retrieval |
| Calendar integrations | Google Calendar API, Microsoft Graph, Zoho Calendar API | Multi-provider coverage for PATNA's member base |
| Storage | Supabase Storage | Headshots, résumés, publications, event assets, content files |
| Internationalisation | next-intl + Google Translate API | Message bundling + dynamic translation cache |
| Rich text editing | Tiptap | Extensible, ProseMirror-based editor |
| Maps | React Simple Maps | Lightweight SVG maps for project footprints |
| Icons | Lucide React | Consistent icon system |

### Architecture Patterns

- **Server Components by default:** Data fetching happens server-side using Supabase server client; client components handle interactivity only.
- **Row-Level Security (RLS):** All tables carry RLS policies. Access is enforced at the database layer, not just the application layer.
- **Role hierarchy:** `admin` > `moderator` / `cohort_lead` > `member`. Roles are stored in `user_roles` and checked via Supabase JWT claims.
- **Invite-only membership:** All members enter through an invite token flow. No self-service registration.
- **Edge functions for secrets:** API key operations (AI, Drive, calendar) run in Supabase Edge Functions or Next.js API routes (server-only), never in client code.
- **Monorepo:** pnpm workspace with `apps/web` as the single deployable application. Extensible to additional apps (e.g., mobile) without restructuring.

---

## 8. Key Strategic Decisions

| Decision | Choice Made | Rationale |
|---|---|---|
| Content editing model | In-app admin UI | Keeps all content in Supabase; avoids split CMS ownership |
| Multilingual strategy | Per-record translations in PostgreSQL + Google Translate cache | Single source of truth; on-demand translation with caching |
| File/storage strategy | Direct upload to Supabase Storage | No external file host; access controlled via signed URLs |
| RBAC model | member / cohort_lead / moderator / editor / admin | Granular enough for PATNA's operational structure |
| Search strategy | Postgres full-text (server-side) with client-side filtering for small sets | Sufficient for current scale; Supabase vector search for AI retrieval |
| AI architecture | RAG with Claude + pgvector embeddings | Role-scoped retrieval; no hallucination of restricted data |
| Deployment responsibility | PATNA owns Vercel merge-to-main and production secrets | Contributors open PRs; PATNA controls release gate |
| Package manager | pnpm | Strict hoisting rules; faster installs; enforced via corepack |

---

## 9. Metrics & Success Criteria

### Member Activation

| Metric | Target |
|---|---|
| Profile completion rate (onboarding → active profile) | ≥ 80% of invited members |
| Members with at least one space membership | ≥ 70% within 30 days of joining |
| Members with calendar connected | ≥ 50% |

### Content Engagement

| Metric | Target |
|---|---|
| Published insights per month | ≥ 4 |
| Monthly active members (returning logins) | ≥ 60% of total members |
| Thread posts per active member per month | ≥ 2 |

### Admin Efficiency

| Metric | Target |
|---|---|
| Application review time (submit → decision) | ≤ 5 business days |
| Event publication time (draft → live) | ≤ 30 minutes |
| Member export completed without errors | 100% |

### AI Assistant Quality

| Metric | Target |
|---|---|
| Query response latency (p95) | ≤ 5 seconds |
| Member satisfaction with assistant responses | ≥ 4 / 5 (post-rollout survey) |
| Hallucinated / out-of-scope responses | < 5% of sampled queries |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RLS policy misconfiguration exposes restricted data | Medium | Critical | Mandatory RLS review on every migration; policy test suite |
| Google Drive API rate limits during sync | Medium | High | Paginated fetch with `nextPageToken`; exponential backoff; sync scheduling |
| Third-party calendar auth token expiry breaks sync | High | Medium | Cron-based token refresh; error reporting to member dashboard |
| AI assistant surfaces restricted content | Low | Critical | Role check before retrieval; assistant access scope displayed to user |
| i18n inconsistency (hardcoded strings in new pages) | High | Medium | Translation function enforced via lint rule; audit i18n coverage per release |
| Supabase cold start latency on edge functions | Medium | Low | Warm-up strategy; move latency-sensitive operations to API routes |
| pnpm/Node version drift across contributors | Low | Medium | Enforced via `.nvmrc` and corepack `packageManager` field |
| Production environment secrets leak via PR | Low | Critical | Vercel owns env vars; `.env.example` used in repo; pre-commit hook review |

---

## 11. Horizon Opportunities

These are not committed roadmap items but represent opportunities worth evaluating as the platform matures.

### Near-Term (6–12 months)
- **Notification system** — email digests, in-app alerts, @mentions in threads
- **Two-factor authentication** — via Supabase Auth TOTP
- **Dark mode** — CSS custom property theming
- **Advanced admin analytics** — engagement trends, cohort heatmaps, content reach

### Medium-Term (12–18 months)
- **Native mobile application** — iOS/Android with push notifications and offline reading
- **Open API** — structured API for partner system integrations (event feeds, member directories)
- **Member-led event creation** — members propose and host their own events within spaces
- **Peer-to-peer bookings** — members book time with each other through the platform

### Longer-Term (18–24 months)
- **Multilingual full rollout** — all public content available in 2+ languages
- **AI-powered knowledge synthesis** — automated summaries of space activity, event outputs, and publication themes
- **Partner network portal** — separate surface for external partners to submit and track service requests
- **Impact measurement dashboard** — track citations, policy influence, and community contributions over time
