# Supabase Schema Outline

## Recommended Domain Modules

Translate the conceptual model into migration groups rather than one large schema dump.

Suggested migration sequence:
- `0001_auth_profiles.sql`
- `0002_taxonomy_and_cohorts.sql`
- `0003_spaces_threads_comments.sql`
- `0004_applications_and_invites.sql`
- `0005_content_and_attachments.sql`
- `0006_events_projects_and_partners.sql`
- `0007_service_requests_and_leads.sql`
- `0008_rls_policies.sql`
- `0009_seed_reference_data.sql`

## Core Tables

Identity:
- `profiles`
- `roles`
- `user_roles`

Taxonomy and cohorts:
- `domain_tags`
- `cohorts`
- `user_cohorts`
- `cohort_leads`

Community onboarding:
- `community_applications`
- `application_cohort_interests`
- `application_tag_interests`
- `invites`

Community spaces:
- `spaces`
- `space_memberships`
- `threads`
- `comments`

Publishing:
- `content_items`
- `content_attachments`
- `content_tag_map`
- `content_cohort_relevance`

Operational pipelines:
- `service_requests`
- `partnership_leads`
- `collaboration_leads`

Optional public-site content:
- `projects`
- `events`
- `partners`

## RLS Model

Baseline access rules:
- public content is readable by anyone
- member content is readable only by authenticated approved members
- restricted content is readable only by assigned roles
- profiles respect each member's visibility setting
- space content is readable only by space members when the space is private
- admin workflows are writable only by admins or delegated moderators

## Auth Model

Use Supabase Auth as the identity backbone.

Recommended flow:
1. Applicant submits community application
2. Admin reviews and approves
3. System issues invite token
4. Invite route creates account and forces password set
5. User completes onboarding profile and cohort details

## Storage Buckets

Recommended buckets:
- `public-assets`
- `content-files`
- `profile-images`
- `event-assets`

Public buckets should stay minimal. Reports, internal briefs, and member-only files should use private buckets with signed access.
