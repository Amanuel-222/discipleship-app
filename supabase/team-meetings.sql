-- Existing TVM projects: apply once to add shared team meeting notes.
begin;
create table public.team_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  date date not null,
  notes text not null check (length(trim(notes)) between 1 and 10000),
  created_at timestamptz not null default now()
);
alter table public.team_meetings enable row level security;
revoke all on public.team_meetings from anon, authenticated;
grant select, insert, update, delete on public.team_meetings to authenticated;
create policy "Approved TVM team only" on public.team_meetings
for all to authenticated
using ((select public.is_tvm_member()))
with check ((select public.is_tvm_member()));
do $$ begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.team_meetings;
  end if;
end; $$;
commit;
