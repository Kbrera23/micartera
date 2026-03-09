
-- 1. Add is_payment_record column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_payment_record boolean DEFAULT false;

-- 2. Create monthly_reminders_completed table
CREATE TABLE IF NOT EXISTS public.monthly_reminders_completed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_type text NOT NULL,
  completed_date date NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, reminder_type, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_reminders_completed ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own completed reminders"
  ON public.monthly_reminders_completed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed reminders"
  ON public.monthly_reminders_completed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed reminders"
  ON public.monthly_reminders_completed FOR DELETE
  USING (auth.uid() = user_id);
