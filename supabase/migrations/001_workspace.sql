-- Single-owner workspace. No private study content belongs in this migration.
create schema if not exists prep_private;
revoke all on schema prep_private from public, anon, authenticated;
create table prep_private.owners (user_id uuid primary key references auth.users(id));

create or replace function public.prep_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from prep_private.owners where user_id = (select auth.uid()));
$$;
revoke all on function public.prep_is_owner() from public, anon;
grant execute on function public.prep_is_owner() to authenticated;

create table public.prep_records (
 owner_id uuid not null references auth.users(id),
 id text not null check (id ~ '^[a-z0-9][a-z0-9_-]{0,119}$'),
 payload jsonb not null check (jsonb_typeof(payload)='object' and payload->>'kind' in ('section','practice')),
 version bigint not null default 1,
 updated_at timestamptz not null default now(),
 primary key(owner_id,id)
);
create table public.prep_revisions (
 owner_id uuid not null references auth.users(id), id text not null,
 payload jsonb not null, version bigint not null, updated_at timestamptz not null default now(),
 primary key(owner_id,id,version)
);
alter table public.prep_records enable row level security;
alter table public.prep_revisions enable row level security;
create policy "owner_reads_records" on public.prep_records for select to authenticated using (owner_id=(select auth.uid()) and (select public.prep_is_owner()));
create policy "owner_reads_history" on public.prep_revisions for select to authenticated using (owner_id=(select auth.uid()) and (select public.prep_is_owner()));
revoke all on public.prep_records,public.prep_revisions from public,anon,authenticated;
grant select on public.prep_records,public.prep_revisions to authenticated;

create or replace function public.save_prep_record(record_id text, new_payload jsonb, expected_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid := auth.uid(); current_row public.prep_records; saved public.prep_records;
begin
 if who is null or not public.prep_is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 if record_id !~ '^[a-z0-9][a-z0-9_-]{0,119}$' or expected_version<0 or new_payload is null or octet_length(new_payload::text)>2000000 then raise exception 'INVALID_RECORD';end if;
 if new_payload->>'kind'='section' then
  if jsonb_typeof(new_payload->'title') is distinct from 'string' or length(new_payload->>'title') not between 1 and 250
   or jsonb_typeof(new_payload->'body') is distinct from 'string'
   or new_payload->>'area' not in ('Start here','Learn','Interview Practice','Reference','My Experience')
   or jsonb_typeof(new_payload->'core') is distinct from 'boolean'
   or jsonb_typeof(new_payload->'archived') is distinct from 'boolean'
   or jsonb_typeof(new_payload->'order') is distinct from 'number'
   or jsonb_typeof(new_payload->'subtitle') is distinct from 'string'
   or jsonb_typeof(new_payload->'minutes') is distinct from 'number'
   then raise exception 'INVALID_SECTION';end if;
 elsif new_payload->>'kind'='practice' then
  if jsonb_typeof(new_payload->'note') is distinct from 'string' or jsonb_typeof(new_payload->'response') is distinct from 'string' or jsonb_typeof(new_payload->'completed') is distinct from 'boolean' then raise exception 'INVALID_PRACTICE';end if;
 else raise exception 'INVALID_KIND';end if;
 -- Serialize both new records and updates; two inserts cannot bypass the version check.
 perform pg_advisory_xact_lock(hashtextextended(who::text||':'||record_id,0));
 select * into current_row from public.prep_records where owner_id=who and id=record_id for update;
 if coalesce(current_row.version,0)<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001';end if;
 insert into public.prep_records(owner_id,id,payload,version,updated_at) values(who,record_id,new_payload,expected_version+1,now())
 on conflict(owner_id,id) do update set payload=excluded.payload, version=excluded.version,updated_at=excluded.updated_at returning * into saved;
 insert into public.prep_revisions(owner_id,id,payload,version,updated_at) values(who,record_id,saved.payload,saved.version,saved.updated_at);
 return jsonb_build_object('id',saved.id,'payload',saved.payload,'version',saved.version,'updated_at',saved.updated_at);
end;
$$;
revoke all on function public.save_prep_record(text,jsonb,bigint) from public,anon;
grant execute on function public.save_prep_record(text,jsonb,bigint) to authenticated;
