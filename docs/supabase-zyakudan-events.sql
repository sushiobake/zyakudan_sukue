-- 弱者男性を救え 用イベントログ（Supabase SQL Editor で実行）
create table if not exists public.zyakudan_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  visitor_id text,
  play_id text,
  level_id text,
  level_index integer,
  question_index integer,
  option_index integer,
  score integer,
  total_score integer,
  rank_title text,
  end_reason text,
  href text,
  referrer text,
  path text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.zyakudan_events enable row level security;

create index if not exists zyakudan_events_created_at_idx
  on public.zyakudan_events (created_at desc);
create index if not exists zyakudan_events_event_type_idx
  on public.zyakudan_events (event_type);
create index if not exists zyakudan_events_play_id_idx
  on public.zyakudan_events (play_id);

grant usage on schema public to service_role;
grant insert, select, delete on table public.zyakudan_events to service_role;
