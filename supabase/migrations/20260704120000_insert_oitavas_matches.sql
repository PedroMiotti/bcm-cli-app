-- Round of 16 (Oitavas de Final) — 2026 FIFA World Cup
-- scheduled_at is UTC (BRT + 3h)
-- match_number starts at 89 (after 88 mata_mata matches)

INSERT INTO public.matches (id, "group", phase, match_number, home_team, away_team, stadium, scheduled_at, status, result)
VALUES

  -- 04/07 — sábado
  ('oi01', 'oitavas', 'oitavas', 89,
   '{"name":"Canadá","code":"CAN","flag":"🇨🇦"}'::jsonb,
   '{"name":"Marrocos","code":"MAR","flag":"🇲🇦"}'::jsonb,
   'A definir', '2026-07-04T17:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('oi02', 'oitavas', 'oitavas', 90,
   '{"name":"Paraguai","code":"PAR","flag":"🇵🇾"}'::jsonb,
   '{"name":"França","code":"FRA","flag":"🇫🇷"}'::jsonb,
   'A definir', '2026-07-04T21:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 05/07 — domingo
  ('oi03', 'oitavas', 'oitavas', 91,
   '{"name":"Brasil","code":"BRA","flag":"🇧🇷"}'::jsonb,
   '{"name":"Noruega","code":"NOR","flag":"🇳🇴"}'::jsonb,
   'A definir', '2026-07-05T20:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('oi04', 'oitavas', 'oitavas', 92,
   '{"name":"México","code":"MEX","flag":"🇲🇽"}'::jsonb,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   'A definir', '2026-07-06T00:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 06/07 — segunda-feira
  ('oi05', 'oitavas', 'oitavas', 93,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   'A definir', '2026-07-06T19:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('oi06', 'oitavas', 'oitavas', 94,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   'A definir', '2026-07-07T00:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 07/07 — terça-feira
  ('oi07', 'oitavas', 'oitavas', 95,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   'A definir', '2026-07-07T16:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('oi08', 'oitavas', 'oitavas', 96,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"TBD","code":"TBD","flag":"🏳️"}'::jsonb,
   'A definir', '2026-07-07T20:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb)

ON CONFLICT (id) DO NOTHING;
