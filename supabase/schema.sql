-- TVM Discipleship: run once in a NEW, dedicated Supabase project.
-- All class data is shared only with explicitly approved auth.users.
-- Public sign-up should be disabled in Authentication settings.
begin;

-- Keep privileged helpers outside the API-exposed public schema.
create schema tvm_private;
revoke all on schema tvm_private from public, anon, authenticated;
grant usage on schema tvm_private to authenticated;

create table public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function tvm_private.is_tvm_member()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.team_members where user_id = (select auth.uid())
  );
$$;
revoke all on function tvm_private.is_tvm_member() from public, anon;
grant execute on function tvm_private.is_tvm_member() to authenticated;

-- The browser RPC runs as the caller; only the internal lookup is privileged.
create function public.is_tvm_member()
returns boolean language sql stable security invoker set search_path = ''
as $$ select tvm_private.is_tvm_member(); $$;
revoke all on function public.is_tvm_member() from public, anon;
grant execute on function public.is_tvm_member() to authenticated;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  email text not null default '' check (length(email) <= 254),
  notes text not null default '' check (length(notes) <= 5000),
  created_at timestamptz not null default now()
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  created_at timestamptz not null default now()
);
create table public.attendance_records (
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text check (status in ('Present','Absent')),
  primary key (session_id,student_id)
);
create index attendance_student_idx on public.attendance_records(student_id);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 5000),
  due_date date,
  created_at timestamptz not null default now()
);
create table public.assignment_submissions (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  submitted boolean not null default false,
  primary key (assignment_id,student_id)
);
create index submissions_student_idx on public.assignment_submissions(student_id);
create table public.progress_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  text text not null check (length(trim(text)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index notes_student_idx on public.progress_notes(student_id);

-- Roster capture is atomic with session/assignment creation. Later students
-- do not inherit absences or assignments from before they joined the class.
create function tvm_private.capture_session_roster()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.attendance_records(session_id,student_id)
  select new.id,id from public.students;
  return new;
end; $$;
create trigger session_roster after insert on public.sessions
for each row execute function tvm_private.capture_session_roster();
create function tvm_private.capture_assignment_roster()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin
  insert into public.assignment_submissions(assignment_id,student_id)
  select new.id,id from public.students;
  return new;
end; $$;
create trigger assignment_roster after insert on public.assignments
for each row execute function tvm_private.capture_assignment_roster();
revoke all on function tvm_private.capture_session_roster() from public,anon,authenticated;
revoke all on function tvm_private.capture_assignment_roster() from public,anon,authenticated;

-- Every business table is protected. A logged-in but unapproved person cannot
-- read or change records. Only the project owner can change team membership.
alter table public.team_members enable row level security;
revoke all on public.team_members from anon,authenticated;
grant select on public.team_members to authenticated;
create policy "Members can see their own approval" on public.team_members
for select to authenticated using (user_id = (select auth.uid()));

do $$ declare t text; begin
  foreach t in array array['students','sessions','attendance_records','assignments','assignment_submissions','progress_notes'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    execute format('create policy "Approved TVM team only" on public.%I for all to authenticated using ((select public.is_tvm_member())) with check ((select public.is_tvm_member()))',t);
  end loop;
end; $$;
-- Application clients may only edit attendance status/submission status.
-- Roster insertion/deletion stays with triggers and parent cascades.
revoke insert,delete,update on public.attendance_records from authenticated;
grant update(status) on public.attendance_records to authenticated;
revoke insert,delete,update on public.assignment_submissions from authenticated;
grant update(submitted) on public.assignment_submissions to authenticated;

-- Optional live updates. This publication exists on Supabase projects.
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['students','sessions','attendance_records','assignments','assignment_submissions','progress_notes'] loop
      if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end loop;
  end if;
end; $$;
commit;
