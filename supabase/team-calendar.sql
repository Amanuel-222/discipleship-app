-- Upgrade meetings into a shared class calendar, preserving every existing note.
begin;
alter table public.team_meetings
 add column kind text not null default 'meeting' check(kind in ('meeting','fellowship')),
 add column start_time time,
 add column end_time time,
 add column location text not null default '' check(length(location)<=240);
alter table public.team_meetings drop constraint team_meetings_notes_check;
alter table public.team_meetings alter column notes set default '';
alter table public.team_meetings add constraint team_meetings_notes_check check(length(trim(notes))<=10000);
alter table public.team_meetings add constraint team_meetings_time_check
 check(end_time is null or (start_time is not null and end_time>start_time));
-- Keep the existing class membership RLS; only editable event fields are granted.
grant update(kind,start_time,end_time,location) on public.team_meetings to authenticated;
commit;
