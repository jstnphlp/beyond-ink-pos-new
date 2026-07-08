-- Transaction contributors table for Design/Dev salary distribution
-- Run after 002_auth_allowed_users.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Table: transaction_contributors
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.transaction_contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.sales_transactions(id) ON DELETE CASCADE,
  staff_member_id uuid NOT NULL REFERENCES public.staff_members(id),
  staff_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_contributors_txn ON public.transaction_contributors(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_contributors_staff ON public.transaction_contributors(staff_member_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS + Grants
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_contributors') THEN
    EXECUTE 'ALTER TABLE public.transaction_contributors ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transaction_contributors_select' AND tablename = 'transaction_contributors') THEN
      EXECUTE 'CREATE POLICY "transaction_contributors_select" ON public.transaction_contributors FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'transaction_contributors_insert' AND tablename = 'transaction_contributors') THEN
      EXECUTE 'CREATE POLICY "transaction_contributors_insert" ON public.transaction_contributors FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.transaction_contributors TO anon, authenticated, service_role;
