-- Distribution payouts tracking table
-- Run after 003_transaction_contributors.sql

CREATE TABLE IF NOT EXISTS public.distribution_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id),
  staff_name text NOT NULL,
  department text NOT NULL,
  period_from timestamptz NOT NULL,
  period_to timestamptz NOT NULL,
  amount numeric(10,2) NOT NULL,
  given boolean NOT NULL DEFAULT false,
  given_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_member_id, department, period_from, period_to)
);

CREATE INDEX IF NOT EXISTS idx_distribution_payouts_staff ON public.distribution_payouts(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_distribution_payouts_period ON public.distribution_payouts(period_from, period_to);
CREATE INDEX IF NOT EXISTS idx_distribution_payouts_dept ON public.distribution_payouts(department);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distribution_payouts') THEN
    EXECUTE 'ALTER TABLE public.distribution_payouts ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'distribution_payouts_select' AND tablename = 'distribution_payouts') THEN
      EXECUTE 'CREATE POLICY "distribution_payouts_select" ON public.distribution_payouts FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'distribution_payouts_insert' AND tablename = 'distribution_payouts') THEN
      EXECUTE 'CREATE POLICY "distribution_payouts_insert" ON public.distribution_payouts FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'distribution_payouts_update' AND tablename = 'distribution_payouts') THEN
      EXECUTE 'CREATE POLICY "distribution_payouts_update" ON public.distribution_payouts FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.distribution_payouts TO anon, authenticated, service_role;
