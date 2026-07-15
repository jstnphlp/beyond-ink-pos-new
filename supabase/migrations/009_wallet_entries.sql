-- Wallet entries (expenses/income) and balance overrides
-- Run after 008_session_department.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wallet_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL CHECK (type IN ('expense', 'income')),
  amount          numeric(10,2) NOT NULL CHECK (amount > 0),
  description     text NOT NULL,
  category_id     uuid REFERENCES public.wallet_categories(id) ON DELETE SET NULL,
  payment_method  text NOT NULL CHECK (payment_method IN ('cash', 'gcash')),
  entry_date      date NOT NULL DEFAULT current_date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_balance_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method  text NOT NULL UNIQUE CHECK (payment_method IN ('cash', 'gcash')),
  amount          numeric(10,2) NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_wallet_entries_type ON public.wallet_entries(type);
CREATE INDEX IF NOT EXISTS idx_wallet_entries_payment ON public.wallet_entries(payment_method);
CREATE INDEX IF NOT EXISTS idx_wallet_entries_date ON public.wallet_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_wallet_entries_category ON public.wallet_entries(category_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed default categories
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.wallet_categories (name, is_default) VALUES
  ('Supplies', true),
  ('Rent', true),
  ('Utilities', true),
  ('Transport', true),
  ('Marketing', true),
  ('Other', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS + Grants
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- wallet_categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_categories') THEN
    EXECUTE 'ALTER TABLE public.wallet_categories ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_categories_select' AND tablename = 'wallet_categories') THEN
      EXECUTE 'CREATE POLICY "wallet_categories_select" ON public.wallet_categories FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_categories_insert' AND tablename = 'wallet_categories') THEN
      EXECUTE 'CREATE POLICY "wallet_categories_insert" ON public.wallet_categories FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_categories_delete' AND tablename = 'wallet_categories') THEN
      EXECUTE 'CREATE POLICY "wallet_categories_delete" ON public.wallet_categories FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;

  -- wallet_entries
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_entries') THEN
    EXECUTE 'ALTER TABLE public.wallet_entries ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_entries_select' AND tablename = 'wallet_entries') THEN
      EXECUTE 'CREATE POLICY "wallet_entries_select" ON public.wallet_entries FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_entries_insert' AND tablename = 'wallet_entries') THEN
      EXECUTE 'CREATE POLICY "wallet_entries_insert" ON public.wallet_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_entries_delete' AND tablename = 'wallet_entries') THEN
      EXECUTE 'CREATE POLICY "wallet_entries_delete" ON public.wallet_entries FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;

  -- wallet_balance_overrides
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_balance_overrides') THEN
    EXECUTE 'ALTER TABLE public.wallet_balance_overrides ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_balance_overrides_select' AND tablename = 'wallet_balance_overrides') THEN
      EXECUTE 'CREATE POLICY "wallet_balance_overrides_select" ON public.wallet_balance_overrides FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_balance_overrides_insert' AND tablename = 'wallet_balance_overrides') THEN
      EXECUTE 'CREATE POLICY "wallet_balance_overrides_insert" ON public.wallet_balance_overrides FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_balance_overrides_update' AND tablename = 'wallet_balance_overrides') THEN
      EXECUTE 'CREATE POLICY "wallet_balance_overrides_update" ON public.wallet_balance_overrides FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'wallet_balance_overrides_delete' AND tablename = 'wallet_balance_overrides') THEN
      EXECUTE 'CREATE POLICY "wallet_balance_overrides_delete" ON public.wallet_balance_overrides FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.wallet_categories TO anon, authenticated, service_role;
GRANT ALL ON public.wallet_entries TO anon, authenticated, service_role;
GRANT ALL ON public.wallet_balance_overrides TO anon, authenticated, service_role;
