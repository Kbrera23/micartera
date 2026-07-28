CREATE TABLE public.pending_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  movimientos JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_imports TO authenticated;
GRANT ALL ON public.pending_imports TO service_role;

ALTER TABLE public.pending_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending imports"
  ON public.pending_imports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pending imports"
  ON public.pending_imports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending imports"
  ON public.pending_imports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending imports"
  ON public.pending_imports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_pending_imports_user_id ON public.pending_imports(user_id);