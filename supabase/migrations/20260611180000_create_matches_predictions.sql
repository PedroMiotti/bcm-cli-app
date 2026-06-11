create table if not exists public.matches (
  id text primary key,
  "group" text not null,
  match_number int not null,
  home_team jsonb not null,
  away_team jsonb not null,
  stadium text not null,
  scheduled_at timestamptz not null,
  status text not null check (status in ('scheduled', 'live', 'finished')),
  result jsonb not null default '{"homeGoals": null, "awayGoals": null}'::jsonb
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  match_id text not null references public.matches (id) on delete cascade,
  home_goals int not null,
  away_goals int not null,
  points int not null default 0,
  point_breakdown jsonb not null default '{"type": "zero", "value": 0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists predictions_user_id_idx on public.predictions (user_id);
create index if not exists predictions_match_id_idx on public.predictions (match_id);

alter table public.matches enable row level security;
alter table public.predictions enable row level security;
