CREATE TABLE public.monthly_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  bank text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_savings TO authenticated;
GRANT ALL ON public.monthly_savings TO service_role;

ALTER TABLE public.monthly_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own monthly_savings" ON public.monthly_savings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own monthly_savings" ON public.monthly_savings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own monthly_savings" ON public.monthly_savings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own monthly_savings" ON public.monthly_savings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER monthly_savings_updated_at
  BEFORE UPDATE ON public.monthly_savings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX monthly_savings_user_period_idx ON public.monthly_savings(user_id, year, month);