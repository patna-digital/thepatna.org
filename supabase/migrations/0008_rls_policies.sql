create or replace function public.current_user_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = role_name
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.domain_tags enable row level security;
alter table public.user_tags enable row level security;
alter table public.cohorts enable row level security;
alter table public.user_cohorts enable row level security;
alter table public.cohort_member_profiles enable row level security;
alter table public.cohort_leads enable row level security;
alter table public.spaces enable row level security;
alter table public.space_memberships enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.community_applications enable row level security;
alter table public.application_cohort_interests enable row level security;
alter table public.application_tag_interests enable row level security;
alter table public.invites enable row level security;
alter table public.content_items enable row level security;
alter table public.content_attachments enable row level security;
alter table public.content_tag_map enable row level security;
alter table public.content_cohort_relevance enable row level security;
alter table public.projects enable row level security;
alter table public.project_resources enable row level security;
alter table public.events enable row level security;
alter table public.event_outputs enable row level security;
alter table public.partners enable row level security;
alter table public.service_requests enable row level security;
alter table public.partnership_leads enable row level security;
alter table public.collaboration_leads enable row level security;

create policy "profiles_self_or_visible"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or visibility_setting in ('members_only', 'limited')
  or public.current_user_has_role('administrator')
);

create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.current_user_has_role('administrator')
)
with check (
  auth.uid() = id
  or public.current_user_has_role('administrator')
);

create policy "user_roles_self_or_admin_read"
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "user_roles_admin_manage"
on public.user_roles
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "reference_data_public_read_tags"
on public.domain_tags
for select
to anon, authenticated
using (true);

create policy "reference_data_public_read_cohorts"
on public.cohorts
for select
to anon, authenticated
using (true);

create policy "taxonomy_admin_manage_tags"
on public.domain_tags
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "taxonomy_admin_manage_cohorts"
on public.cohorts
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "user_tags_members_read"
on public.user_tags
for select
to authenticated
using (true);

create policy "user_tags_self_or_admin_manage"
on public.user_tags
for all
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "user_cohorts_members_read"
on public.user_cohorts
for select
to authenticated
using (true);

create policy "user_cohorts_admin_manage"
on public.user_cohorts
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "cohort_member_profiles_self_or_admin_read"
on public.cohort_member_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "cohort_member_profiles_self_or_admin_insert"
on public.cohort_member_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "cohort_member_profiles_self_or_admin_update"
on public.cohort_member_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  user_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "cohort_leads_members_read"
on public.cohort_leads
for select
to authenticated
using (true);

create policy "cohort_leads_admin_manage"
on public.cohort_leads
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "spaces_visible_to_members"
on public.spaces
for select
to authenticated
using (
  visibility = 'public_members'
  or exists (
    select 1
    from public.space_memberships
    where space_memberships.space_id = spaces.id
      and space_memberships.user_id = auth.uid()
  )
  or public.current_user_has_role('administrator')
);

create policy "spaces_admin_manage"
on public.spaces
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "space_memberships_visible_to_members"
on public.space_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.spaces
    where spaces.id = space_memberships.space_id
      and (
        spaces.visibility = 'public_members'
        or exists (
          select 1
          from public.space_memberships as memberships
          where memberships.space_id = spaces.id
            and memberships.user_id = auth.uid()
        )
      )
  )
  or public.current_user_has_role('administrator')
);

create policy "space_memberships_admin_manage"
on public.space_memberships
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "threads_visible_if_space_visible"
on public.threads
for select
to authenticated
using (
  exists (
    select 1
    from public.spaces
    where spaces.id = threads.space_id
      and (
        spaces.visibility = 'public_members'
        or exists (
          select 1
          from public.space_memberships
          where space_memberships.space_id = spaces.id
            and space_memberships.user_id = auth.uid()
        )
      )
  )
  or public.current_user_has_role('administrator')
);

create policy "threads_member_insert"
on public.threads
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.spaces
    where spaces.id = threads.space_id
      and (
        spaces.visibility = 'public_members'
        or exists (
          select 1
          from public.space_memberships
          where space_memberships.space_id = spaces.id
            and space_memberships.user_id = auth.uid()
        )
      )
  )
);

create policy "threads_author_or_admin_update"
on public.threads
for update
to authenticated
using (
  author_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  author_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "comments_visible_if_thread_visible"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.threads
    join public.spaces on spaces.id = threads.space_id
    where threads.id = comments.thread_id
      and (
        spaces.visibility = 'public_members'
        or exists (
          select 1
          from public.space_memberships
          where space_memberships.space_id = spaces.id
            and space_memberships.user_id = auth.uid()
        )
      )
  )
  or public.current_user_has_role('administrator')
);

create policy "comments_member_insert"
on public.comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.threads
    join public.spaces on spaces.id = threads.space_id
    where threads.id = comments.thread_id
      and (
        spaces.visibility = 'public_members'
        or exists (
          select 1
          from public.space_memberships
          where space_memberships.space_id = spaces.id
            and space_memberships.user_id = auth.uid()
        )
      )
  )
);

create policy "comments_author_or_admin_update"
on public.comments
for update
to authenticated
using (
  author_id = auth.uid()
  or public.current_user_has_role('administrator')
)
with check (
  author_id = auth.uid()
  or public.current_user_has_role('administrator')
);

create policy "community_applications_public_insert"
on public.community_applications
for insert
to anon, authenticated
with check (true);

create policy "community_applications_admin_read_manage"
on public.community_applications
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "application_cohort_interests_admin_manage"
on public.application_cohort_interests
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "application_tag_interests_admin_manage"
on public.application_tag_interests
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "invites_admin_manage"
on public.invites
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "content_public_and_member_visibility"
on public.content_items
for select
to anon, authenticated
using (
  (publish_status = 'published' and visibility = 'public')
  or (
    publish_status = 'published'
    and visibility = 'members'
    and auth.role() = 'authenticated'
  )
  or public.current_user_has_role('administrator')
);

create policy "content_admin_manage"
on public.content_items
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "content_attachments_visibility"
on public.content_attachments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = content_attachments.content_id
      and (
        (content_items.publish_status = 'published' and content_items.visibility = 'public')
        or (
          content_items.publish_status = 'published'
          and content_items.visibility = 'members'
          and auth.role() = 'authenticated'
        )
        or public.current_user_has_role('administrator')
      )
  )
);

create policy "content_attachments_admin_manage"
on public.content_attachments
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "content_tag_map_visibility"
on public.content_tag_map
for select
to anon, authenticated
using (true);

create policy "content_tag_map_admin_manage"
on public.content_tag_map
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "content_cohort_relevance_visibility"
on public.content_cohort_relevance
for select
to authenticated
using (true);

create policy "content_cohort_relevance_admin_manage"
on public.content_cohort_relevance
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "projects_public_read"
on public.projects
for select
to anon, authenticated
using (status = 'published' or public.current_user_has_role('administrator'));

create policy "projects_admin_manage"
on public.projects
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "project_resources_public_read"
on public.project_resources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_resources.project_id
      and (projects.status = 'published' or public.current_user_has_role('administrator'))
  )
);

create policy "project_resources_admin_manage"
on public.project_resources
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "events_visibility"
on public.events
for select
to anon, authenticated
using (
  (status = 'published' and visibility = 'public')
  or (
    status = 'published'
    and visibility = 'members'
    and auth.role() = 'authenticated'
  )
  or public.current_user_has_role('administrator')
);

create policy "events_admin_manage"
on public.events
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "event_outputs_visibility"
on public.event_outputs
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_outputs.event_id
      and (
        (events.status = 'published' and events.visibility = 'public')
        or (
          events.status = 'published'
          and events.visibility = 'members'
          and auth.role() = 'authenticated'
        )
        or public.current_user_has_role('administrator')
      )
  )
);

create policy "event_outputs_admin_manage"
on public.event_outputs
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "partners_public_read"
on public.partners
for select
to anon, authenticated
using (is_active = true or public.current_user_has_role('administrator'));

create policy "partners_admin_manage"
on public.partners
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "service_requests_public_insert"
on public.service_requests
for insert
to anon, authenticated
with check (true);

create policy "service_requests_admin_manage"
on public.service_requests
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "partnership_leads_public_insert"
on public.partnership_leads
for insert
to anon, authenticated
with check (true);

create policy "partnership_leads_admin_manage"
on public.partnership_leads
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));

create policy "collaboration_leads_public_insert"
on public.collaboration_leads
for insert
to anon, authenticated
with check (true);

create policy "collaboration_leads_admin_manage"
on public.collaboration_leads
for all
to authenticated
using (public.current_user_has_role('administrator'))
with check (public.current_user_has_role('administrator'));
