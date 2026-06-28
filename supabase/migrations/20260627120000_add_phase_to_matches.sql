ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'grupo';

CREATE INDEX IF NOT EXISTS matches_phase_idx ON public.matches(phase);
