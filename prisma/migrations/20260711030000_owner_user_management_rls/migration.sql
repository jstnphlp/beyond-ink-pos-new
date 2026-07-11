-- Grants and RLS policies
-- Wrapped in DO block for auth-dependent policies (Prisma shadow DB lacks auth schema)

-- ═══════════════════════════════════════════════════════════════════════════════
-- Schema-level grants for PostgREST
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS policies (require Supabase auth schema)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN

    -- allowed_users: owners can CRUD all rows (uses get_user_role() SECURITY DEFINER to avoid circular RLS)
    EXECUTE 'ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "allowed_users_select_owner" ON public.allowed_users FOR SELECT TO authenticated USING (
      public.get_user_role() = ''owner''
    )';
    EXECUTE 'CREATE POLICY "allowed_users_insert_owner" ON public.allowed_users FOR INSERT TO authenticated WITH CHECK (
      public.get_user_role() = ''owner''
    )';
    EXECUTE 'CREATE POLICY "allowed_users_update_owner" ON public.allowed_users FOR UPDATE TO authenticated USING (
      public.get_user_role() = ''owner''
    ) WITH CHECK (
      public.get_user_role() = ''owner''
    )';
    EXECUTE 'CREATE POLICY "allowed_users_delete_owner" ON public.allowed_users FOR DELETE TO authenticated USING (
      public.get_user_role() = ''owner''
    )';

    -- staff_members
    EXECUTE 'ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "staff_members_select" ON public.staff_members FOR SELECT TO authenticated USING (public.is_allowed_user())';

    -- staff_sessions
    EXECUTE 'ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "staff_sessions_select" ON public.staff_sessions FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "staff_sessions_insert" ON public.staff_sessions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "staff_sessions_update" ON public.staff_sessions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';

    -- service_categories
    EXECUTE 'ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';

    -- services
    EXECUTE 'ALTER TABLE public.services ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';

    -- add_ons
    EXECUTE 'ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "add_ons_select" ON public.add_ons FOR SELECT TO authenticated USING (public.is_allowed_user())';

    -- inventory_items
    EXECUTE 'ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';

    -- inventory_movements
    EXECUTE 'ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "inventory_movements_insert" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';

    -- service_material_prices
    EXECUTE 'ALTER TABLE public.service_material_prices ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "service_material_prices_select" ON public.service_material_prices FOR SELECT TO authenticated USING (public.is_allowed_user())';

    -- sales_transactions
    EXECUTE 'ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "sales_transactions_select" ON public.sales_transactions FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_insert" ON public.sales_transactions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_update" ON public.sales_transactions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_transactions_delete" ON public.sales_transactions FOR DELETE TO authenticated USING (public.is_allowed_user())';

    -- sales_service_lines
    EXECUTE 'ALTER TABLE public.sales_service_lines ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "sales_service_lines_select" ON public.sales_service_lines FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_service_lines_insert" ON public.sales_service_lines FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';

    -- sales_material_entries
    EXECUTE 'ALTER TABLE public.sales_material_entries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "sales_material_entries_select" ON public.sales_material_entries FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_material_entries_insert" ON public.sales_material_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';

    -- sales_add_on_entries
    EXECUTE 'ALTER TABLE public.sales_add_on_entries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "sales_add_on_entries_select" ON public.sales_add_on_entries FOR SELECT TO authenticated USING (public.is_allowed_user())';
    EXECUTE 'CREATE POLICY "sales_add_on_entries_insert" ON public.sales_add_on_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';

  END IF;
END
$$;
