-- Owner-run, one-time reconciliation of manual first names with Classroom.
-- Nicknames and ambiguous names require separate human review.
begin;
lock table public.students,public.attendance_records,public.assignment_submissions,public.progress_notes in share row exclusive mode;
do $$
declare target uuid; pair record; merged integer:=0;
begin
 select id into strict target from public.ministries where slug='discipleship';
 perform 1 from public.ministries where id=target for update;
 insert into tvm_private.classroom_cleanup_backups(ministry_id,snapshot)
 select target,jsonb_build_object(
  'students',(select coalesce(jsonb_agg(s),'[]') from public.students s where ministry_id=target),
  'attendance',(select coalesce(jsonb_agg(r),'[]') from public.attendance_records r where ministry_id=target),
  'submissions',(select coalesce(jsonb_agg(r),'[]') from public.assignment_submissions r where ministry_id=target),
  'notes',(select coalesce(jsonb_agg(n),'[]') from public.progress_notes n where ministry_id=target));
 for pair in
  with matches as (
   select m.id manual_id,g.id google_id from public.students m
   join public.students g on g.ministry_id=m.ministry_id
    and g.classroom_user_id is not null
    and lower(trim(m.name))=lower(split_part(trim(g.name),' ',1))
   where m.ministry_id=target and m.classroom_user_id is null
    and (m.email='' or lower(m.email)=lower(g.email))
  ) select * from matches x where
   (select count(*) from matches y where y.manual_id=x.manual_id)=1
   and (select count(*) from matches y where y.google_id=x.google_id)=1
 loop
  -- Conflicting marked attendance must never be silently overwritten.
  if exists(select 1 from public.attendance_records m join public.attendance_records g using(session_id)
   where m.student_id=pair.manual_id and g.student_id=pair.google_id
    and m.status is not null and g.status is not null and m.status<>g.status) then
   raise exception 'Conflicting attendance requires manual review.';
  end if;
  insert into public.attendance_records(session_id,student_id,status,ministry_id)
   select session_id,pair.manual_id,status,ministry_id from public.attendance_records where student_id=pair.google_id
   on conflict(session_id,student_id) do update set status=coalesce(public.attendance_records.status,excluded.status);
  insert into public.assignment_submissions(assignment_id,student_id,submitted,late,ministry_id)
   select assignment_id,pair.manual_id,submitted,late,ministry_id from public.assignment_submissions where student_id=pair.google_id
   on conflict(assignment_id,student_id) do update set submitted=case
    when exists(select 1 from public.assignments a where a.id=excluded.assignment_id and a.classroom_work_id is not null)
    then excluded.submitted else public.assignment_submissions.submitted or excluded.submitted end,late=case when exists(select 1 from public.assignments a where a.id=excluded.assignment_id and a.classroom_work_id is not null) then excluded.late else public.assignment_submissions.late or excluded.late end;
  update public.progress_notes set student_id=pair.manual_id where student_id=pair.google_id;
  -- Keep the original student ID/name and its history; attach Google's email/ID.
  update public.students m set email=case when m.email='' then g.email else m.email end,
   notes=case when g.notes='' or g.notes=m.notes then m.notes when m.notes='' then g.notes else m.notes||E'\n\n'||g.notes end
   from public.students g where m.id=pair.manual_id and g.id=pair.google_id;
  -- Release the unique source identity before assigning it to the kept record.
  with removed as (delete from public.students where id=pair.google_id returning classroom_course_id,classroom_user_id)
   update public.students m set classroom_course_id=r.classroom_course_id,classroom_user_id=r.classroom_user_id
   from removed r where m.id=pair.manual_id;
  merged:=merged+1;
 end loop;
 raise notice 'Merged % duplicate students.',merged;
end $$;
commit;
