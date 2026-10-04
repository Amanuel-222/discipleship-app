-- Upgrade the existing TVM class without deleting its records.
begin;
create table public.ministries (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null check(length(trim(name)) between 1 and 80)
);
create table public.church_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.ministry_members (
 ministry_id uuid not null references public.ministries(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('leader','member')),
 created_at timestamptz not null default now(),
 primary key(ministry_id,user_id)
);
create index ministry_members_user_idx on public.ministry_members(user_id);
insert into public.ministries(slug,name) values
 ('discipleship','Discipleship'),('foundations','Foundations'),('ministry-empowerment','Ministry Empowerment');
insert into public.ministry_members(ministry_id,user_id,created_at)
 select m.id,t.user_id,t.created_at from public.team_members t cross join public.ministries m where m.slug='discipleship';
-- The project owner separately approves the intended church administrator.
-- No account is automatically promoted by this schema script.

create function tvm_private.is_church_admin() returns boolean
language sql stable security definer set search_path=''
as $$ select (select auth.uid()) is not null and exists(select 1 from public.church_admins where user_id=(select auth.uid())); $$;
create function tvm_private.can_access_ministry(target uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select (select auth.uid()) is not null and (tvm_private.is_church_admin() or exists(select 1 from public.ministry_members where ministry_id=target and user_id=(select auth.uid()))); $$;
create function tvm_private.can_manage_ministry(target uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select (select auth.uid()) is not null and (tvm_private.is_church_admin() or exists(select 1 from public.ministry_members where ministry_id=target and user_id=(select auth.uid()) and role='leader')); $$;
revoke all on function tvm_private.is_church_admin(),tvm_private.can_access_ministry(uuid),tvm_private.can_manage_ministry(uuid) from public,anon;
grant execute on function tvm_private.is_church_admin(),tvm_private.can_access_ministry(uuid),tvm_private.can_manage_ministry(uuid) to authenticated;
create or replace function tvm_private.is_tvm_member() returns boolean
language sql stable security definer set search_path=''
as $$ select (select auth.uid()) is not null and (tvm_private.is_church_admin() or exists(select 1 from public.ministry_members where user_id=(select auth.uid()))); $$;

-- Existing data belongs to Discipleship. New writes must explicitly choose a class.
do $$ declare t text; begin
 foreach t in array array['students','sessions','assignments','team_meetings','attendance_records','assignment_submissions','progress_notes'] loop
  execute format('alter table public.%I add column ministry_id uuid references public.ministries(id)',t);
  execute format('update public.%I set ministry_id=(select id from public.ministries where slug=''discipleship'')',t);
  execute format('alter table public.%I alter column ministry_id set not null',t);
  execute format('create index %I on public.%I(ministry_id)',t||'_ministry_idx',t);
  execute format('drop policy "Approved TVM team only" on public.%I',t);
  execute format('create policy "Class team only" on public.%I for all to authenticated using ((select tvm_private.can_access_ministry(ministry_id))) with check ((select tvm_private.can_access_ministry(ministry_id)))',t);
 end loop;
end $$;
alter table public.sessions drop constraint sessions_date_key;
alter table public.sessions add unique(ministry_id,date);
alter table public.assignments add column topic text not null default 'General' check(length(trim(topic)) between 1 and 80);
-- Composite keys enforce class separation even when clients forge foreign IDs.
alter table public.students add unique(id,ministry_id);
alter table public.sessions add unique(id,ministry_id);
alter table public.assignments add unique(id,ministry_id);
alter table public.attendance_records add foreign key(session_id,ministry_id) references public.sessions(id,ministry_id) on delete cascade;
alter table public.attendance_records add foreign key(student_id,ministry_id) references public.students(id,ministry_id) on delete cascade;
alter table public.assignment_submissions add foreign key(assignment_id,ministry_id) references public.assignments(id,ministry_id) on delete cascade;
alter table public.assignment_submissions add foreign key(student_id,ministry_id) references public.students(id,ministry_id) on delete cascade;
alter table public.progress_notes add foreign key(student_id,ministry_id) references public.students(id,ministry_id) on delete cascade;
create or replace function tvm_private.capture_session_roster() returns trigger
language plpgsql security definer set search_path=''
as $$ begin insert into public.attendance_records(session_id,student_id,ministry_id) select new.id,id,new.ministry_id from public.students where ministry_id=new.ministry_id; return new; end; $$;
create or replace function tvm_private.capture_assignment_roster() returns trigger
language plpgsql security definer set search_path=''
as $$ begin insert into public.assignment_submissions(assignment_id,student_id,ministry_id) select new.id,id,new.ministry_id from public.students where ministry_id=new.ministry_id; return new; end; $$;
-- A client can edit record contents, but cannot move a record to another class.
revoke update on public.students,public.sessions,public.assignments,public.progress_notes,public.team_meetings from authenticated;
grant update(name,email,notes) on public.students to authenticated;
grant update(date) on public.sessions to authenticated;
grant update(title,description,due_date,topic) on public.assignments to authenticated;
grant update(text) on public.progress_notes to authenticated;
grant update(title,date,notes) on public.team_meetings to authenticated;

alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.church_admins enable row level security;
revoke all on public.ministries,public.ministry_members,public.church_admins from public,anon,authenticated;
grant select on public.ministries,public.ministry_members to authenticated;
create policy "Accessible ministries" on public.ministries for select to authenticated using((select tvm_private.can_access_ministry(id)));
create policy "Class memberships" on public.ministry_members for select to authenticated using((select tvm_private.can_access_ministry(ministry_id)));
create function tvm_private.my_ministries() returns table(id uuid,name text,slug text,role text)
language sql stable security definer set search_path=''
as $$ select m.id,m.name,m.slug,case when tvm_private.is_church_admin() then 'admin' else mm.role end from public.ministries m left join public.ministry_members mm on mm.ministry_id=m.id and mm.user_id=(select auth.uid()) where tvm_private.can_access_ministry(m.id) order by case when m.slug='discipleship' then 0 else 1 end,m.name; $$;
create function public.my_ministries() returns table(id uuid,name text,slug text,role text)
language sql stable security invoker set search_path='' as $$ select * from tvm_private.my_ministries(); $$;
revoke all on function tvm_private.my_ministries(),public.my_ministries() from public,anon;
grant execute on function tvm_private.my_ministries(),public.my_ministries() to authenticated;

create function tvm_private.class_team_directory(target uuid)
returns table(user_id uuid,email text,approved_at timestamptz,role text)
language plpgsql stable security definer set search_path=''
as $$ begin
 if not tvm_private.can_access_ministry(target) then raise exception 'Class access is required.' using errcode='42501'; end if;
 return query select u.id,u.email::text,coalesce(mm.created_at,ca.created_at),case when ca.user_id is not null then 'admin' else mm.role end from auth.users u left join public.ministry_members mm on mm.user_id=u.id and mm.ministry_id=target left join public.church_admins ca on ca.user_id=u.id where mm.user_id is not null or ca.user_id is not null order by lower(u.email);
end $$;
create function public.class_team_directory(ministry uuid)
returns table(user_id uuid,email text,approved_at timestamptz,role text)
language sql stable security invoker set search_path='' as $$ select * from tvm_private.class_team_directory(ministry); $$;
revoke all on function tvm_private.class_team_directory(uuid),public.class_team_directory(uuid) from public,anon;
grant execute on function tvm_private.class_team_directory(uuid),public.class_team_directory(uuid) to authenticated;
-- Older directory clients may only see the Discipleship team, with its access guard.
create or replace function tvm_private.team_directory()
returns table(user_id uuid,email text,approved_at timestamptz)
language sql stable security definer set search_path=''
as $$ select d.user_id,d.email,d.approved_at from tvm_private.class_team_directory((select id from public.ministries where slug='discipleship')) d; $$;

-- Leaders manage existing app accounts for their own class. Only church admins
-- can grant/change leader roles. Invites still use Supabase's owner dashboard.
create function tvm_private.manage_class_member(target uuid,member_email text,member_role text,remove_member boolean)
returns void language plpgsql security definer set search_path=''
as $$ declare target_user uuid; previous_role text; begin
 if not tvm_private.can_manage_ministry(target) then raise exception 'Class leader access is required.' using errcode='42501'; end if;
 if member_role not in ('member','leader') or member_role is null then raise exception 'Choose member or leader.'; end if;
 select id into target_user from auth.users where lower(email)=lower(trim(member_email));
 if target_user is null then raise exception 'Invite this email in Supabase first, then add it to this class.'; end if;
 if exists(select 1 from public.church_admins where user_id=target_user) then raise exception 'Church administrators already have access to every class.'; end if;
 select role into previous_role from public.ministry_members where ministry_id=target and user_id=target_user;
 if not tvm_private.is_church_admin() and (member_role='leader' or previous_role='leader') then raise exception 'Only a church administrator can change class leaders.' using errcode='42501'; end if;
 if remove_member then delete from public.ministry_members where ministry_id=target and user_id=target_user;
 else insert into public.ministry_members(ministry_id,user_id,role) values(target,target_user,member_role) on conflict(ministry_id,user_id) do update set role=excluded.role; end if;
end $$;
create function public.manage_class_member(ministry uuid,member_email text,member_role text default 'member',remove_member boolean default false)
returns void language sql security invoker set search_path='' as $$ select tvm_private.manage_class_member(ministry,member_email,member_role,remove_member); $$;
revoke all on function tvm_private.manage_class_member(uuid,text,text,boolean),public.manage_class_member(uuid,text,text,boolean) from public,anon;
grant execute on function tvm_private.manage_class_member(uuid,text,text,boolean),public.manage_class_member(uuid,text,text,boolean) to authenticated;
commit;
