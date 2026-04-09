
CREATE TABLE public.monthly_payments_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payment_type text NOT NULL,
  amount numeric NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  paid_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, payment_type, month, year)
);

ALTER TABLE public.monthly_payments_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.monthly_payments_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.monthly_payments_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
