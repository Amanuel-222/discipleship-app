-- Private recovery snapshots for owner-run student cleanup.
create table tvm_private.classroom_cleanup_backups (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 ministry_id uuid not null,
 snapshot jsonb not null
);
alter table tvm_private.classroom_cleanup_backups enable row level security;
revoke all on tvm_private.classroom_cleanup_backups from public,anon,authenticated;
