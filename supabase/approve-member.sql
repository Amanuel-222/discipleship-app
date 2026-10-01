-- After creating a user in Authentication > Users, run this in the SQL Editor.
-- Replace the email with the exact account to approve; this sends no email.
insert into public.team_members (user_id)
select id from auth.users where lower(email) = lower('replace-with-team-member@example.com')
on conflict (user_id) do nothing;
-- Verify ONE matching account was approved:
select u.email from public.team_members m join auth.users u on u.id=m.user_id
where lower(u.email) = lower('replace-with-team-member@example.com');

-- To revoke access later (replace the email and uncomment):
-- delete from public.team_members where user_id in
-- (select id from auth.users where lower(email)=lower('replace-with-team-member@example.com'));
