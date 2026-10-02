-- M1: all mutations enter through the authenticated command boundary.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table private.operators (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id),
  created_at timestamptz not null default now()
);
alter table private.operators enable row level security;
revoke all on private.operators from public, anon, authenticated;
grant select on private.operators to authenticated;
create policy operator_self on private.operators for select to authenticated
  using (user_id = (select auth.uid()));

create function private.is_operator() returns boolean
language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from private.operators where user_id = auth.uid()
  );
$$;
revoke all on function private.is_operator() from public, anon;
grant execute on function private.is_operator() to authenticated;
create function public.is_operator() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_operator();
$$;
revoke all on function public.is_operator() from public, anon;
grant execute on function public.is_operator() to authenticated;

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','COMPLETED','KILLED')),
  stage text not null default 'DISCOVERING' check (stage in ('DISCOVERING','CHALLENGING','SELECTING','PLANNING','BUILDING','TESTING','DECIDING')),
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  ended_at timestamptz,
  acquisition_budget_pence integer not null default 0 check (acquisition_budget_pence = 0),
  constitution_version text not null default '1',
  autonomy_policy text not null default 'operator-only-v1',
  version integer not null default 1 check (version > 0),
  event_sequence integer not null default 0,
  check (deadline_at = started_at + interval '168 hours'),
  check ((status in ('COMPLETED','KILLED')) = (ended_at is not null))
);
create unique index one_active_experiment on public.experiments ((true)) where status in ('ACTIVE','PAUSED');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id),
  sequence integer not null check (sequence > 0),
  type text not null,
  actor_type text not null check (actor_type = 'operator'),
  actor_id uuid not null,
  visibility text not null default 'private' check (visibility = 'private'),
  schema_version integer not null default 1,
  command_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (experiment_id, sequence)
);
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id),
  actor_id uuid not null,
  type text not null,
  reason text not null check (length(reason) between 1 and 1000),
  minutes_estimate numeric check (minutes_estimate >= 0 and minutes_estimate <= 10080),
  related_event_id uuid not null references public.events(id),
  created_at timestamptz not null default now()
);
create index interventions_experiment on public.interventions(experiment_id);
-- Approval storage only. No grant/execute adapter is provided until M5.
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id),
  action_type text not null,
  risk_level text not null check (risk_level in ('AMBER','RED')),
  request_payload jsonb not null,
  action_version integer not null check (action_version > 0),
  policy_version text not null,
  requested_by uuid not null,
  expires_at timestamptz not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED')),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((status in ('APPROVED','REJECTED')) = (decided_by is not null and decided_at is not null))
);
create index approvals_experiment on public.approvals(experiment_id);
create table private.commands (
  id uuid primary key,
  actor_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table private.commands enable row level security;
revoke all on private.commands from public, anon, authenticated;

alter table public.experiments enable row level security;
alter table public.events enable row level security;
alter table public.interventions enable row level security;
alter table public.approvals enable row level security;
revoke all on public.experiments, public.events, public.interventions, public.approvals from public, anon, authenticated;
grant select on public.experiments, public.events, public.interventions, public.approvals to authenticated;
create policy operator_read on public.experiments for select to authenticated using ((select private.is_operator()));
create policy operator_read on public.events for select to authenticated using ((select private.is_operator()));
create policy operator_read on public.interventions for select to authenticated using ((select private.is_operator()));
create policy operator_read on public.approvals for select to authenticated using ((select private.is_operator()));
revoke all on sequence public.experiments_number_seq from public, anon, authenticated;

create function private.reject_audit_mutation() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin raise exception 'Audit records are append-only'; end;
$$;
create trigger events_immutable before update or delete on public.events
for each row execute function private.reject_audit_mutation();
create trigger interventions_immutable before update or delete on public.interventions
for each row execute function private.reject_audit_mutation();
create trigger commands_immutable before update or delete on private.commands
for each row execute function private.reject_audit_mutation();

create function private.append_event(p_experiment uuid, p_type text, p_command uuid, p_payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare seq integer; event_id uuid;
begin
  update public.experiments set event_sequence = event_sequence + 1 where id = p_experiment returning event_sequence into seq;
  insert into public.events(experiment_id, sequence, type, actor_type, actor_id, command_id, payload)
  values (p_experiment, seq, p_type, 'operator', auth.uid(), p_command, p_payload) returning id into event_id;
  return event_id;
end;
$$;
revoke all on function private.append_event(uuid,text,uuid,jsonb) from public, anon, authenticated;
revoke all on function private.reject_audit_mutation() from public, anon, authenticated;

-- SECURITY DEFINER is deliberate: clients have SELECT only. The private body checks
-- the current operator for every invocation; public wrapper is SECURITY INVOKER.
create function private.experiment_command(
  p_command_id uuid, p_kind text, p_experiment_id uuid, p_expected_version integer,
  p_next_stage text, p_reason text, p_minutes numeric
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  request jsonb;
  prior private.commands%rowtype;
  exp public.experiments%rowtype;
  before_state jsonb;
  result jsonb;
  event_id uuid;
  intervention_id uuid;
  event_type text;
  stages text[] := array['DISCOVERING','CHALLENGING','SELECTING','PLANNING','BUILDING','TESTING','DECIDING'];
  instant timestamptz;
begin
  if actor is null or not exists(select 1 from private.operators where user_id = actor) then
    raise exception 'Operator access required' using errcode = '42501';
  end if;
  if p_command_id is null or p_kind is null or p_kind not in ('START','PAUSE','RESUME','KILL','ADVANCE','COMPLETE')
     or p_reason is null or length(trim(p_reason)) not between 1 and 1000
     or (p_minutes is not null and (p_minutes < 0 or p_minutes > 10080)) then
    raise exception 'Invalid command' using errcode = '22023';
  end if;
  request := jsonb_build_object('kind',p_kind,'experiment_id',p_experiment_id,'expected_version',p_expected_version,
    'next_stage',p_next_stage,'reason',trim(p_reason),'minutes',p_minutes);
  -- V1 has one operator and one active experiment. Short transactions share one lock.
  perform pg_catalog.pg_advisory_xact_lock(19002401);
  instant := clock_timestamp();
  select * into prior from private.commands where id = p_command_id;
  if found then
    if prior.actor_id <> actor or prior.payload <> request then
      raise exception 'Command ID already used for a different request' using errcode = '22023';
    end if;
    return prior.result;
  end if;
  if p_kind = 'START' then
    if p_experiment_id is not null or p_expected_version is not null or p_next_stage is not null then
      raise exception 'Invalid start command' using errcode = '22023';
    end if;
    if exists(select 1 from public.experiments where status in ('ACTIVE','PAUSED')) then
      raise exception 'An experiment is already active' using errcode = '23505';
    end if;
    insert into public.experiments(started_at,deadline_at) values (instant,instant + interval '168 hours') returning * into exp;
    perform private.append_event(exp.id,'experiment.created',p_command_id,jsonb_build_object('constitution_version',exp.constitution_version,'autonomy_policy',exp.autonomy_policy));
    event_type := 'experiment.started';
  else
    select * into exp from public.experiments where id = p_experiment_id for update;
    if not found then raise exception 'Experiment not found' using errcode = 'P0002'; end if;
    if p_expected_version is null or p_expected_version <> exp.version then
      raise exception 'Stale experiment version; refresh before retrying' using errcode = '40001';
    end if;
    if exp.status in ('COMPLETED','KILLED') then raise exception 'Experiment is terminal'; end if;
    if p_kind <> 'ADVANCE' and p_next_stage is not null then raise exception 'Unexpected next stage'; end if;
    before_state := jsonb_build_object('stage',exp.stage,'status',exp.status,'version',exp.version);
    case p_kind
      when 'PAUSE' then
        if exp.status <> 'ACTIVE' then raise exception 'Only active experiments can pause'; end if;
        exp.status := 'PAUSED'; event_type := 'experiment.paused';
      when 'RESUME' then
        if exp.status <> 'PAUSED' or instant >= exp.deadline_at then raise exception 'Cannot resume: status or deadline'; end if;
        exp.status := 'ACTIVE'; event_type := 'experiment.resumed';
      when 'KILL' then
        exp.status := 'KILLED'; exp.ended_at := instant; event_type := 'experiment.killed';
      when 'ADVANCE' then
        if p_next_stage is null or not (p_next_stage = any(stages)) or (p_next_stage = exp.stage and not (p_next_stage = 'DECIDING' and exp.status = 'PAUSED' and instant >= exp.deadline_at)) then raise exception 'Invalid stage transition'; end if;
        if instant >= exp.deadline_at then
          if p_next_stage <> 'DECIDING' then raise exception 'Deadline reached; only final analysis is allowed'; end if;
          exp.status := 'ACTIVE';
        elsif exp.status <> 'ACTIVE' or array_position(stages,p_next_stage) <> array_position(stages,exp.stage) + 1 then
          raise exception 'Invalid stage transition';
        end if;
        exp.stage := p_next_stage; event_type := 'stage.changed';
      when 'COMPLETE' then
        if exp.stage <> 'DECIDING' or exp.status <> 'ACTIVE' then raise exception 'Only active final analysis can complete'; end if;
        exp.status := 'COMPLETED'; exp.ended_at := instant; event_type := 'experiment.completed';
    end case;
    update public.experiments set status=exp.status,stage=exp.stage,ended_at=exp.ended_at,version=version+1
      where id=exp.id returning * into exp;
  end if;
  event_id := private.append_event(exp.id,event_type,p_command_id,
    jsonb_build_object('before',before_state,'stage',exp.stage,'status',exp.status,'version',exp.version,'deadline_at',exp.deadline_at,'rationale',trim(p_reason)));
  insert into public.interventions(experiment_id,actor_id,type,reason,minutes_estimate,related_event_id)
    values(exp.id,actor,p_kind,trim(p_reason),p_minutes,event_id) returning id into intervention_id;
  perform private.append_event(exp.id,'intervention.logged',p_command_id,jsonb_build_object('intervention_id',intervention_id,'minutes_estimate',p_minutes));
  select to_jsonb(e) into result from public.experiments e where e.id=exp.id;
  insert into private.commands(id,actor_id,payload,result) values(p_command_id,actor,request,result);
  return result;
end;
$$;
revoke all on function private.experiment_command(uuid,text,uuid,integer,text,text,numeric) from public, anon;
grant execute on function private.experiment_command(uuid,text,uuid,integer,text,text,numeric) to authenticated;
create function public.experiment_command(
  p_command_id uuid, p_kind text, p_experiment_id uuid default null, p_expected_version integer default null,
  p_next_stage text default null, p_reason text default null, p_minutes numeric default null
) returns jsonb language sql security invoker set search_path = '' as $$
  select private.experiment_command(p_command_id,p_kind,p_experiment_id,p_expected_version,p_next_stage,p_reason,p_minutes);
$$;
revoke all on function public.experiment_command(uuid,text,uuid,integer,text,text,numeric) from public, anon;
grant execute on function public.experiment_command(uuid,text,uuid,integer,text,text,numeric) to authenticated;

-- One statement snapshot keeps the rendered state and its ledger consistent.
create function public.control_room() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with latest as (select * from public.experiments order by number desc limit 1)
  select jsonb_build_object(
    'experiment', (select to_jsonb(e) from latest e),
    'observed_at', statement_timestamp(),
    'events', coalesce((select jsonb_agg(e order by e.sequence desc) from (
      select id,sequence,type,created_at,payload from public.events
      where experiment_id = (select id from latest) order by sequence desc limit 100
    ) e), '[]'::jsonb),
    'interventions', coalesce((select jsonb_agg(i order by i.created_at desc) from (
      select id,type,reason,minutes_estimate,created_at from public.interventions
      where experiment_id = (select id from latest) order by created_at desc limit 100
    ) i), '[]'::jsonb),
    'approvals', coalesce((select jsonb_agg(a order by a.created_at desc) from (
      select id,action_type,risk_level,status,expires_at,created_at from public.approvals
      where experiment_id = (select id from latest) and status = 'PENDING' order by created_at desc limit 100
    ) a), '[]'::jsonb)
  );
$$;
revoke all on function public.control_room() from public, anon;
grant execute on function public.control_room() to authenticated;
