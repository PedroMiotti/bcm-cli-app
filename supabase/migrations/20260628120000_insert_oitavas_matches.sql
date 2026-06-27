-- Round of 32 (Mata-Mata / 16 avos de final) — 2026 FIFA World Cup
-- scheduled_at is UTC (BRT + 3h)
-- match_number starts at 73 (after 72 group-stage matches)

INSERT INTO public.matches (id, "group", phase, match_number, home_team, away_team, stadium, scheduled_at, status, result)
VALUES

  -- 28/06 — domingo
  ('o01', 'mata_mata', 'mata_mata', 73,
   '{"name":"África do Sul","code":"RSA","flag":"🇿🇦"}'::jsonb,
   '{"name":"Canadá","code":"CAN","flag":"🇨🇦"}'::jsonb,
   'Los Angeles', '2026-06-28T19:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 29/06 — segunda-feira
  ('o02', 'mata_mata', 'mata_mata', 74,
   '{"name":"Brasil","code":"BRA","flag":"🇧🇷"}'::jsonb,
   '{"name":"Japão","code":"JPN","flag":"🇯🇵"}'::jsonb,
   'Houston', '2026-06-29T17:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o03', 'mata_mata', 'mata_mata', 75,
   '{"name":"Alemanha","code":"GER","flag":"🇩🇪"}'::jsonb,
   '{"name":"3º A/B/C/D/F","code":"TBD","flag":"🏳️"}'::jsonb,
   'Boston', '2026-06-29T20:30:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o04', 'mata_mata', 'mata_mata', 76,
   '{"name":"Países Baixos","code":"NED","flag":"🇳🇱"}'::jsonb,
   '{"name":"Marrocos","code":"MAR","flag":"🇲🇦"}'::jsonb,
   'Monterrey', '2026-06-30T01:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 30/06 — terça-feira
  ('o05', 'mata_mata', 'mata_mata', 77,
   '{"name":"Côte d''Ivoire","code":"CIV","flag":"🇨🇮"}'::jsonb,
   '{"name":"Noruega","code":"NOR","flag":"🇳🇴"}'::jsonb,
   'Dallas', '2026-06-30T17:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o06', 'mata_mata', 'mata_mata', 78,
   '{"name":"França","code":"FRA","flag":"🇫🇷"}'::jsonb,
   '{"name":"3º C/D/F/G/H","code":"TBD","flag":"🏳️"}'::jsonb,
   'Nova Jersey', '2026-06-30T21:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o07', 'mata_mata', 'mata_mata', 79,
   '{"name":"México","code":"MEX","flag":"🇲🇽"}'::jsonb,
   '{"name":"3º C/E/F/H/I","code":"TBD","flag":"🏳️"}'::jsonb,
   'Cidade do México', '2026-07-01T01:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 01/07 — quarta-feira
  ('o08', 'mata_mata', 'mata_mata', 80,
   '{"name":"1º Grupo L","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"3º E/H/I/J/K","code":"TBD","flag":"🏳️"}'::jsonb,
   'Atlanta', '2026-07-01T16:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o09', 'mata_mata', 'mata_mata', 81,
   '{"name":"Bélgica","code":"BEL","flag":"🇧🇪"}'::jsonb,
   '{"name":"3º A/E/H/I/J","code":"TBD","flag":"🏳️"}'::jsonb,
   'Seattle', '2026-07-01T20:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o10', 'mata_mata', 'mata_mata', 82,
   '{"name":"Estados Unidos","code":"USA","flag":"🇺🇸"}'::jsonb,
   '{"name":"Bósnia e Herzegovina","code":"BIH","flag":"🇧🇦"}'::jsonb,
   'Santa Clara', '2026-07-02T00:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 02/07 — quinta-feira
  ('o11', 'mata_mata', 'mata_mata', 83,
   '{"name":"Espanha","code":"ESP","flag":"🇪🇸"}'::jsonb,
   '{"name":"2º Grupo J","code":"TBD","flag":"🏳️"}'::jsonb,
   'Los Angeles', '2026-07-02T19:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o12', 'mata_mata', 'mata_mata', 84,
   '{"name":"2º Grupo K","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"2º Grupo L","code":"TBD","flag":"🏳️"}'::jsonb,
   'Toronto', '2026-07-02T23:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  -- 03/07 — sexta-feira
  ('o13', 'mata_mata', 'mata_mata', 85,
   '{"name":"Suíça","code":"SUI","flag":"🇨🇭"}'::jsonb,
   '{"name":"3º E/F/G/I/J","code":"TBD","flag":"🏳️"}'::jsonb,
   'Vancouver', '2026-07-03T03:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o14', 'mata_mata', 'mata_mata', 86,
   '{"name":"Austrália","code":"AUS","flag":"🇦🇺"}'::jsonb,
   '{"name":"Egito","code":"EGY","flag":"🇪🇬"}'::jsonb,
   'Dallas', '2026-07-03T18:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o15', 'mata_mata', 'mata_mata', 87,
   '{"name":"Argentina","code":"ARG","flag":"🇦🇷"}'::jsonb,
   '{"name":"Cabo Verde","code":"CPV","flag":"🇨🇻"}'::jsonb,
   'Miami', '2026-07-03T22:00:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb),

  ('o16', 'mata_mata', 'mata_mata', 88,
   '{"name":"1º Grupo K","code":"TBD","flag":"🏳️"}'::jsonb,
   '{"name":"3º D/E/I/J/L","code":"TBD","flag":"🏳️"}'::jsonb,
   'Kansas City', '2026-07-04T01:30:00Z', 'scheduled',
   '{"homeGoals":null,"awayGoals":null}'::jsonb)

ON CONFLICT (id) DO NOTHING;
