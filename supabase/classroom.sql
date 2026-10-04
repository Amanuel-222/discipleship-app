-- Apply after church-classes.sql. No Google credentials are stored here.
begin;
create table public.classroom_links (
 ministry_id uuid primary key references public.ministries(id) on delete cascade,
 course_id text not null check(length(course_id) between 1 and 100),
 course_name text not null check(length(course_name) between 1 and 200),
 last_synced_at timestamptz
);
alter table public.classroom_links enable row level security;
revoke all on public.classroom_links from public,anon,authenticated;
grant select on public.classroom_links to authenticated;
create policy "Classroom link visibility" on public.classroom_links for select to authenticated using ((select tvm_private.can_access_ministry(ministry_id)));
alter table public.students add classroom_course_id text, add classroom_user_id text;
create unique index students_classroom_identity on public.students(ministry_id,classroom_course_id,classroom_user_id);
alter table public.assignments add classroom_course_id text, add classroom_work_id text, add classroom_url text;
create unique index assignments_classroom_identity on public.assignments(ministry_id,classroom_course_id,classroom_work_id);
-- Ordinary app writes cannot fabricate Google source identifiers.
revoke insert on public.students,public.assignments from authenticated;
grant insert(id,name,email,notes,created_at,ministry_id) on public.students to authenticated;
grant insert(id,title,description,due_date,created_at,ministry_id,topic) on public.assignments to authenticated;
-- Only the guarded import can edit source identifiers or rebuild imported rosters.
create function tvm_private.sync_classroom(target uuid,payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare course text; person jsonb; work jsonb; submission jsonb; sid uuid; aid uuid; candidates integer; student_count integer:=0; assignment_count integer:=0; previous_course text;
begin
 if not tvm_private.can_manage_ministry(target) then raise exception 'Only a class leader can sync Classroom.' using errcode='42501'; end if;
 if jsonb_typeof(payload->'students') is distinct from 'array' or jsonb_typeof(payload->'assignments') is distinct from 'array' then raise exception 'Incomplete Classroom data. Nothing was saved.'; end if;
 if octet_length(payload::text)>10000000 then raise exception 'This Classroom import is too large.'; end if;
 course:=payload->>'courseId';
 if course is null or course !~ '^[0-9]+$' then raise exception 'Invalid Classroom course.'; end if;
 -- Serialize syncs for this class so repeat clicks cannot create duplicates.
 perform 1 from public.ministries where id=target for update;
 select course_id into previous_course from public.classroom_links where ministry_id=target;
 if previous_course is not null and previous_course<>course then raise exception 'This class is already linked to another Classroom course. Contact your administrator before changing it.'; end if;
 for person in select value from jsonb_array_elements(payload->'students') loop
  if coalesce(person->>'id','')='' then raise exception 'A Classroom student has no ID.'; end if;
  sid:=null;
  select id into sid from public.students where ministry_id=target and classroom_course_id=course and classroom_user_id=person->>'id';
  if sid is null and coalesce(person->>'email','')<>'' then
   select count(*) into candidates from public.students where ministry_id=target and lower(email)=lower(person->>'email') and classroom_user_id is null;
   if candidates>1 then raise exception 'Duplicate student emails in this class. Resolve them before syncing.'; end if;
   select id into sid from public.students where ministry_id=target and lower(email)=lower(person->>'email') and classroom_user_id is null;
  end if;
  if sid is null then
   insert into public.students(ministry_id,name,email,classroom_course_id,classroom_user_id) values(target,left(coalesce(nullif(trim(person->>'name'),''),'Classroom student'),120),left(coalesce(person->>'email',''),254),course,person->>'id') returning id into sid;
  else
   -- Preserve locally edited names, emails, notes and all attendance history.
   update public.students set classroom_course_id=course,classroom_user_id=person->>'id' where id=sid and ministry_id=target;
  end if;
  student_count:=student_count+1;
 end loop;
 for work in select value from jsonb_array_elements(payload->'assignments') loop
  if coalesce(work->>'id','')='' or jsonb_typeof(work->'submissions') is distinct from 'array' then raise exception 'Incomplete assignment data. Nothing was saved.'; end if;
  if coalesce(work->>'url','') !~ '^https://classroom.google.com/' then raise exception 'Invalid Classroom assignment link.'; end if;
  insert into public.assignments(ministry_id,title,description,topic,due_date,classroom_course_id,classroom_work_id,classroom_url)
   values(target,left(coalesce(nullif(trim(work->>'title'),''),'Classroom assignment'),160),left(coalesce(work->>'description',''),5000),left(coalesce(nullif(trim(work->>'topic'),''),'General'),80),nullif(work->>'dueDate','')::date,course,work->>'id',work->>'url')
   on conflict(ministry_id,classroom_course_id,classroom_work_id) do update set title=excluded.title,description=excluded.description,topic=excluded.topic,due_date=excluded.due_date,classroom_url=excluded.classroom_url returning id into aid;
  -- Classroom's submissions define who received each assignment (including
  -- individual assignments). Do not count an unrelated local student as missing.
  delete from public.assignment_submissions where assignment_id=aid and ministry_id=target;
  for submission in select value from jsonb_array_elements(work->'submissions') loop
   sid:=null;
   select id into sid from public.students where ministry_id=target and classroom_course_id=course and classroom_user_id=submission->>'userId';
   if sid is not null then
    insert into public.assignment_submissions(ministry_id,assignment_id,student_id,submitted) values(target,aid,sid,coalesce((submission->>'submitted')::boolean,false));
   end if;
  end loop;
  assignment_count:=assignment_count+1;
 end loop;
 insert into public.classroom_links(ministry_id,course_id,course_name,last_synced_at) values(target,course,left(coalesce(nullif(payload->>'courseName',''),'Classroom'),200),now())
 on conflict(ministry_id) do update set course_name=excluded.course_name,last_synced_at=excluded.last_synced_at;
 return jsonb_build_object('students',student_count,'assignments',assignment_count);
end $$;
create function public.sync_classroom(ministry uuid,payload jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select tvm_private.sync_classroom(ministry,payload); $$;
revoke all on function tvm_private.sync_classroom(uuid,jsonb),public.sync_classroom(uuid,jsonb) from public,anon;
grant execute on function tvm_private.sync_classroom(uuid,jsonb),public.sync_classroom(uuid,jsonb) to authenticated;
commit;
