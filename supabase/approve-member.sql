-- Owner-controlled approval for one class. Invite the email first in Supabase.
-- Replace the email and class slug (discipleship, foundations, ministry-empowerment).
insert into public.ministry_members(ministry_id,user_id,role)
select m.id,u.id,'member' from public.ministries m cross join auth.users u
where m.slug='discipleship' and lower(u.email)=lower('replace-with-team-member@example.com')
on conflict(ministry_id,user_id) do nothing;
select u.email,m.name,mm.role from public.ministry_members mm
join public.ministries m on m.id=mm.ministry_id join auth.users u on u.id=mm.user_id
where m.slug='discipleship' and lower(u.email)=lower('replace-with-team-member@example.com');
-- Existing church admins/class leaders can also use Team & settings in the app.
