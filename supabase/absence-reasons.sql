-- Existing project upgrade: retain legacy absences with unknown reasons.
begin;
alter table public.attendance_records drop constraint attendance_records_status_check;
alter table public.attendance_records add constraint attendance_records_status_check check(status in ('Present','Late','Absent','Excused','Unexcused'));
commit;
