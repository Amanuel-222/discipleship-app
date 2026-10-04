-- Add to an existing TVM class once. No authentication secrets are exposed.
begin;
create function tvm_private.team_directory()
returns table(user_id uuid, email text, approved_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not tvm_private.is_tvm_member() then
    raise exception 'TVM team approval is required.' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.created_at
    from public.team_members m join auth.users u on u.id=m.user_id
    order by lower(u.email), m.user_id;
end;
$$;
revoke all on function tvm_private.team_directory() from public, anon;
grant execute on function tvm_private.team_directory() to authenticated;
-- Keep the privileged join outside the Data API's exposed schema.
create function public.team_directory()
returns table(user_id uuid, email text, approved_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from tvm_private.team_directory(); $$;
revoke all on function public.team_directory() from public, anon;
grant execute on function public.team_directory() to authenticated;
commit;
