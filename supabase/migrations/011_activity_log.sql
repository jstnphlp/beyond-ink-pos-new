-- Activity log for wallet actions (balance overrides, expense/income entries)
-- Run after 010_inventory_items_missing_columns.sql

CREATE TABLE IF NOT EXISTS public.activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action          text NOT NULL CHECK (action IN (
    'balance_override_set',
    'balance_override_cleared',
    'expense_added',
    'income_added',
    'entry_deleted'
  )),
  performed_by    text NOT NULL,
  payment_method  text CHECK (payment_method IN ('cash', 'gcash')),
  amount          numeric(10,2),
  description     text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- RLS + Grants

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    EXECUTE 'ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_log_select' AND tablename = 'activity_log') THEN
      EXECUTE 'CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'activity_log_insert' AND tablename = 'activity_log') THEN
      EXECUTE 'CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.activity_log TO anon, authenticated, service_role;
