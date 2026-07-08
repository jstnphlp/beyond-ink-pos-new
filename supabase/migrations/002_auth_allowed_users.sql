-- Auth + allowed_users with role-based access
-- Run after 001_staff_sessions_rls.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Role enum
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('owner', 'staff');
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Update allowed_users table (only if it exists from Prisma)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_users') THEN
    -- Add name column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'allowed_users' AND column_name = 'name'
    ) THEN
      ALTER TABLE public.allowed_users ADD COLUMN name text;
    END IF;

    -- Convert role column from text to user_role enum
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'allowed_users' AND column_name = 'role' AND data_type = 'text'
    ) THEN
      UPDATE public.allowed_users SET role = 'staff' WHERE role NOT IN ('owner', 'staff');
      ALTER TABLE public.allowed_users ALTER COLUMN role DROP DEFAULT;
      ALTER TABLE public.allowed_users
        ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
      ALTER TABLE public.allowed_users ALTER COLUMN role SET DEFAULT 'staff';
    END IF;
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Helper: get current user's role from allowed_users
-- Returns NULL if the user's email is not in allowed_users
-- Uses EXECUTE to avoid errors when allowed_users doesn't exist yet
-- ═══════════════════════════════════════════════════════════════════════════════

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_users') THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_user_role()
      RETURNS public.user_role
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $body$
        SELECT au.role
        FROM public.allowed_users au
        WHERE au.email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        LIMIT 1;
      $body$;
    $fn$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_allowed_user()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.allowed_users au
          WHERE au.email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        );
      $body$;
    $fn$;
  END IF;
END
$outer$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS: allowed_users (only authenticated users can read their own row)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_users') THEN
    EXECUTE 'ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allowed_users_select_own' AND tablename = 'allowed_users') THEN
      EXECUTE 'CREATE POLICY "allowed_users_select_own" ON public.allowed_users FOR SELECT TO authenticated USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))';
    END IF;
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS: auth-gated policies for all tables
-- Drops old open policies, creates new ones requiring auth + whitelist
-- All statements use EXECUTE to avoid errors when tables don't exist
-- ═══════════════════════════════════════════════════════════════════════════════

-- staff_members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_members') THEN
    EXECUTE 'ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "staff_members_select_all" ON public.staff_members;
    DROP POLICY IF EXISTS "staff_members_select" ON public.staff_members;
    EXECUTE 'CREATE POLICY "staff_members_select" ON public.staff_members FOR SELECT TO authenticated USING (public.is_allowed_user())';
  END IF;
END
$$;

-- staff_sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_sessions') THEN
    EXECUTE 'ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "staff_sessions_select_all" ON public.staff_sessions;
    DROP POLICY IF EXISTS "staff_sessions_insert_all" ON public.staff_sessions;
    DROP POLICY IF EXISTS "staff_sessions_update_all" ON public.staff_sessions;
    DROP POLICY IF EXISTS "staff_sessions_select" ON public.staff_sessions;
    DROP POLICY IF EXISTS "staff_sessions_insert" ON public.staff_sessions;
    DROP POLICY IF EXISTS "staff_sessions_update" ON public.staff_sessions;

    EXECUTE 'CREATE POLICY "staff_sessions_select" ON public.staff_sessions FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "staff_sessions_insert" ON public.staff_sessions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "staff_sessions_update" ON public.staff_sessions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- service_categories
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN
    EXECUTE 'ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "service_categories_select" ON public.service_categories;
    DROP POLICY IF EXISTS "service_categories_insert" ON public.service_categories;
    DROP POLICY IF EXISTS "service_categories_update" ON public.service_categories;

    EXECUTE 'CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- services
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    EXECUTE 'ALTER TABLE public.services ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "services_select" ON public.services;
    DROP POLICY IF EXISTS "services_insert" ON public.services;
    DROP POLICY IF EXISTS "services_update" ON public.services;

    EXECUTE 'CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- add_ons
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'add_ons') THEN
    EXECUTE 'ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "add_ons_select" ON public.add_ons;
    EXECUTE 'CREATE POLICY "add_ons_select" ON public.add_ons FOR SELECT TO authenticated USING (public.is_allowed_user())';
  END IF;
END
$$;

-- inventory_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items') THEN
    EXECUTE 'ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "inventory_items_select" ON public.inventory_items;
    DROP POLICY IF EXISTS "inventory_items_insert" ON public.inventory_items;
    DROP POLICY IF EXISTS "inventory_items_update" ON public.inventory_items;

    EXECUTE 'CREATE POLICY "inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- inventory_movements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_movements') THEN
    EXECUTE 'ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "inventory_movements_select" ON public.inventory_movements;
    DROP POLICY IF EXISTS "inventory_movements_insert" ON public.inventory_movements;

    EXECUTE 'CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_movements_insert" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- service_material_prices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_material_prices') THEN
    EXECUTE 'ALTER TABLE public.service_material_prices ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "service_material_prices_select" ON public.service_material_prices;
    EXECUTE 'CREATE POLICY "service_material_prices_select" ON public.service_material_prices FOR SELECT TO authenticated USING (public.is_allowed_user())';
  END IF;
END
$$;

-- sales_transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_transactions') THEN
    EXECUTE 'ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "sales_transactions_select" ON public.sales_transactions;
    DROP POLICY IF EXISTS "sales_transactions_insert" ON public.sales_transactions;
    DROP POLICY IF EXISTS "sales_transactions_update" ON public.sales_transactions;
    DROP POLICY IF EXISTS "sales_transactions_delete" ON public.sales_transactions;

    EXECUTE 'CREATE POLICY "sales_transactions_select" ON public.sales_transactions FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_insert" ON public.sales_transactions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_update" ON public.sales_transactions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_delete" ON public.sales_transactions FOR DELETE TO authenticated USING (public.is_allowed_user())';
  END IF;
END
$$;

-- sales_service_lines
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_service_lines') THEN
    EXECUTE 'ALTER TABLE public.sales_service_lines ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "sales_service_lines_select" ON public.sales_service_lines;
    DROP POLICY IF EXISTS "sales_service_lines_insert" ON public.sales_service_lines;

    EXECUTE 'CREATE POLICY "sales_service_lines_select" ON public.sales_service_lines FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_service_lines_insert" ON public.sales_service_lines FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- sales_material_entries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_material_entries') THEN
    EXECUTE 'ALTER TABLE public.sales_material_entries ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "sales_material_entries_select" ON public.sales_material_entries;
    DROP POLICY IF EXISTS "sales_material_entries_insert" ON public.sales_material_entries;

    EXECUTE 'CREATE POLICY "sales_material_entries_select" ON public.sales_material_entries FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_material_entries_insert" ON public.sales_material_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;

-- sales_add_on_entries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_add_on_entries') THEN
    EXECUTE 'ALTER TABLE public.sales_add_on_entries ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS "sales_add_on_entries_select" ON public.sales_add_on_entries;
    DROP POLICY IF EXISTS "sales_add_on_entries_insert" ON public.sales_add_on_entries;

    EXECUTE 'CREATE POLICY "sales_add_on_entries_select" ON public.sales_add_on_entries FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_add_on_entries_insert" ON public.sales_add_on_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
  END IF;
END
$$;
