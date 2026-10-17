-- Tighten payload validation without changing records or applied migrations.
create or replace function public.save_prep_record(record_id text, new_payload jsonb, expected_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid := auth.uid(); current_row public.prep_records; saved public.prep_records;
begin
 if who is null or not public.prep_is_owner() then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 if record_id !~ '^[a-z0-9][a-z0-9_-]{0,119}$' or expected_version<0 or new_payload is null or octet_length(new_payload::text)>2000000 then raise exception 'INVALID_RECORD';end if;
 if new_payload->>'kind'='section' then
  if jsonb_typeof(new_payload->'title') is distinct from 'string' or length(new_payload->>'title') not between 1 and 250
   or jsonb_typeof(new_payload->'body') is distinct from 'string'
   or new_payload->>'area' is null or new_payload->>'area' not in ('Start here','Learn','Interview Practice','Reference','My Experience')
   or jsonb_typeof(new_payload->'core') is distinct from 'boolean'
   or jsonb_typeof(new_payload->'archived') is distinct from 'boolean'
   or jsonb_typeof(new_payload->'order') is distinct from 'number'
   or jsonb_typeof(new_payload->'subtitle') is distinct from 'string'
   or jsonb_typeof(new_payload->'minutes') is distinct from 'number'
   or (new_payload->>'minutes')::numeric not between 1 and 120
   or (new_payload ? 'answer' and jsonb_typeof(new_payload->'answer') <> 'string')
   or (new_payload ? 'source' and jsonb_typeof(new_payload->'source') <> 'string')
   or (new_payload ? 'links' and jsonb_typeof(new_payload->'links') <> 'array')
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
