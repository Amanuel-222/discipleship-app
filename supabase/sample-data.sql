-- Optional: fictional records for an empty TEST project only.
begin;
do $$ begin
 if exists(select 1 from public.students) or exists(select 1 from public.sessions) or exists(select 1 from public.assignments) or exists(select 1 from public.progress_notes) then
  raise exception 'Sample seed cancelled: class data is not empty.';
 end if;
end; $$;
insert into public.students(id,name,email) values
('10000000-0000-0000-0000-000000000001','Hannah Bekele','sample1@example.com'),
('10000000-0000-0000-0000-000000000002','Daniel Tesfaye','sample2@example.com'),
('10000000-0000-0000-0000-000000000003','Sarah Wilson','sample3@example.com'),
('10000000-0000-0000-0000-000000000004','Nathan Abraham','sample4@example.com'),
('10000000-0000-0000-0000-000000000005','Ruth Mekonnen','sample5@example.com'),
('10000000-0000-0000-0000-000000000006','Samuel Assefa','sample6@example.com'),
('10000000-0000-0000-0000-000000000007','Esther Williams','sample7@example.com'),
('10000000-0000-0000-0000-000000000008','Joshua Alemu','sample8@example.com');
insert into public.sessions(date) values('2026-09-06'),('2026-09-13'),('2026-09-20'),('2026-09-27');
update public.attendance_records set status='Present' where session_id in(select id from public.sessions where date<'2026-09-27');
update public.attendance_records set status='Absent' where student_id='10000000-0000-0000-0000-000000000004' and session_id in(select id from public.sessions where date<'2026-09-27');
insert into public.assignments(title,description,due_date)values('Reflection on Romans 6','Write a short reflection on walking in newness of life.','2026-10-04'),('Personal testimony','Prepare a three-minute testimony.','2026-09-27');
update public.assignment_submissions set submitted=true where student_id<>'10000000-0000-0000-0000-000000000004';
insert into public.progress_notes(student_id,text)values('10000000-0000-0000-0000-000000000004','Needs follow-up. Check in this week.'),('10000000-0000-0000-0000-000000000001','More engaged this week. Shared a thoughtful reflection.');
commit;
