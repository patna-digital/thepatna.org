-- 0051 · project parent hierarchy guardrails

create or replace function public.prevent_project_parent_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_project_id is null then
    return new;
  end if;

  if new.parent_project_id = new.id then
    raise exception 'A project cannot be its own parent project.';
  end if;

  if exists (
    with recursive parent_chain(id, parent_project_id) as (
      select p.id, p.parent_project_id
      from public.projects p
      where p.id = new.parent_project_id

      union all

      select p.id, p.parent_project_id
      from public.projects p
      join parent_chain chain on p.id = chain.parent_project_id
      where chain.parent_project_id is not null
    )
    select 1
    from parent_chain
    where id = new.id
  ) then
    raise exception 'Project parent hierarchy cannot contain a cycle.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_project_parent_cycle on public.projects;
create trigger prevent_project_parent_cycle
before insert or update of parent_project_id on public.projects
for each row
execute function public.prevent_project_parent_cycle();

update public.projects p
set parent_project_id = null
from public.project_series s
where s.slug = 'leap-project-series'
  and p.series_id = s.id
  and p.slug in ('leap-phase-i', 'leap-phase-ii', 'patna-phase-iii-2026');
