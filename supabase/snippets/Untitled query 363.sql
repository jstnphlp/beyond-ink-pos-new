-- Costing: cost_profiles, quotes, quote_line_items, app_settings
-- Run after 006_services_catalog.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cost_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  material_cost    numeric(10,2) NOT NULL DEFAULT 0,
  ink_cost         numeric(10,2) NOT NULL DEFAULT 0,
  spoilage_rate    numeric(5,2) NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  notes      text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id          uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  cost_profile_id   uuid NOT NULL REFERENCES public.cost_profiles(id),
  quantity          numeric(10,2) NOT NULL DEFAULT 1,
  snap_material_cost numeric(10,2) NOT NULL DEFAULT 0,
  snap_ink_cost     numeric(10,2) NOT NULL DEFAULT 0,
  snap_overhead_cost numeric(10,2) NOT NULL DEFAULT 0,
  snap_spoilage_rate numeric(5,2) NOT NULL DEFAULT 0,
  snap_selling_price numeric(10,2) NOT NULL DEFAULT 0,
  override_price    numeric(10,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  sort_order        int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_cp_service ON public.cost_profiles(service_id);
CREATE INDEX IF NOT EXISTS idx_cp_item ON public.cost_profiles(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_cp_active ON public.cost_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_qli_quote ON public.quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_qli_cost_profile ON public.quote_line_items(cost_profile_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed default margin thresholds
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.app_settings (key, value) VALUES
  ('margin_thresholds', '{"great": 50, "good": 35}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed cost_profiles from existing pricing spreadsheet
-- service_id and inventory_item_id match seeds in 006_services_catalog.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- Standard Printing (Black) + papers
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('3e837b1c-55c0-4022-8acb-59b86b43bb3e', 'c0000000-0000-0000-0000-000000000001', 0.47, 1.00),  -- Short/A4 — B&W
  ('3e837b1c-55c0-4022-8acb-59b86b43bb3e', 'c0000000-0000-0000-0000-000000000002', 0.57, 1.00)   -- Long — B&W
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Standard Printing (Colored) + papers
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('60e4d600-0954-4744-86e2-d80069b0b144', 'c0000000-0000-0000-0000-000000000003', 0.47, 2.00),  -- Short/A4 — Colored
  ('60e4d600-0954-4744-86e2-d80069b0b144', 'c0000000-0000-0000-0000-000000000004', 0.57, 2.00)   -- Long — Colored
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Photo Printing
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('12eb3c6e-63d9-4722-8dca-289c7132cb4c', 'c0000000-0000-0000-0000-000000000005', 0.33, 1.00),  -- 2R — Photoprint
  ('14ed7e2b-59b7-4e17-88b7-3fdd4d5ac03c', 'c0000000-0000-0000-0000-000000000006', 4.10, 3.00),  -- 3R — Photoprint
  ('12fa46f8-52de-4744-80f7-a1e04024c1bc', 'c0000000-0000-0000-0000-000000000007', 4.15, 3.00),  -- 4R — Photoprint
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'c0000000-0000-0000-0000-000000000008', 8.70, 5.00),  -- A4 — Photoprint
  ('c62ca05f-bdb9-40a3-8c6a-2c7d7b9550fc', 'c0000000-0000-0000-0000-000000000034', 8.70, 5.00),  -- A4 Photo Print — Matte
  ('98878d57-3fed-4e6b-8544-355da76a233c', 'c0000000-0000-0000-0000-000000000030', 4.15, 3.00)   -- 4R — Rush ID
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Stickers
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000009', 4.36, 5.00),  -- A4 Glossy Sticker
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000010', 6.40, 5.00),  -- A4 Matte Sticker
  ('7415f128-666a-4814-8464-1720127f793c', 'c0000000-0000-0000-0000-000000000011', 9.10, 5.00)   -- A4 Vinyl Sticker
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Sintra Board
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('6f70e9d8-1e5d-4064-8b93-5860712de9bc', 'c0000000-0000-0000-0000-000000000012', 35.40, 5.00)  -- Sintra Board with Sticker
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Laminating
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000013', 1.40, 1.00),  -- Hot Laminate ID
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000014', 6.50, 1.00),  -- Hot Laminate Half
  ('251def70-13c6-4446-8c7b-38a036dbcb36', 'c0000000-0000-0000-0000-000000000015', 1.69, 1.00),  -- Hot Laminate A4
  ('b7452ffa-e6ec-4658-895b-d9f051a9e9a2', 'c0000000-0000-0000-0000-000000000016', 9.00, 0.00)   -- Phototop/Coldtop A4
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Certificates & Awards
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000017', 8.40, 4.00),  -- Cert Specialty
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000018', 2.75, 4.00),  -- Cert Parchment
  ('45ec6270-8622-406e-8983-4c20c3ce121e', 'c0000000-0000-0000-0000-000000000019', 5.50, 4.00)   -- Cert Linen
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Flyers & Brochures
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000028', 3.54, 5.00),  -- Brochure Paper A4
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000029', 3.54, 5.00),  -- Flyer Paper A4
  ('f9007b52-41de-4178-8003-c070b8deaa2a', 'c0000000-0000-0000-0000-000000000036', 1.69, 5.00)   -- Inkjet Paper A4
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Business Cards & Invitation Cards
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('dd8da488-ad9f-4688-8eb0-184070121200', 'c0000000-0000-0000-0000-000000000026', 4.00, 5.00),  -- Business Card
  ('5148a58b-1492-47ff-80a0-927545da0274', 'c0000000-0000-0000-0000-000000000027', 2.00, 5.00)   -- Invitation Card
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Magazines
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('2f43b49c-d81e-4ea8-8a0c-0e60f75d7a34', 'c0000000-0000-0000-0000-000000000020', 3.54, 5.00),  -- Magazine A4 Colored
  ('12a4170b-5f22-48b9-84f6-6ef34d864fb2', 'c0000000-0000-0000-0000-000000000021', 2.00, 1.00)   -- Magazine A5 Colored
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Book Binding
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost) VALUES
  ('09fd9dd0-cea5-4e6c-81ba-f3c0c758e3bc', 'c0000000-0000-0000-0000-000000000025', 12.00, 0.00),  -- Staple Bind
  ('b4c3d7c8-2425-4112-8701-741090e6c6da', 'c0000000-0000-0000-0000-000000000022', 15.00, 0.00),  -- Spiral/Coil Bind
  ('56c738cf-5126-425b-84f1-3f9507e1aa94', 'c0000000-0000-0000-0000-000000000023', 10.00, 0.00),  -- Tape Bind
  ('dcd98bac-31d4-4bc6-82a3-ab08ed0d706a', 'c0000000-0000-0000-0000-000000000024', 80.00, 0.00)   -- Hard-Bound
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS + Grants
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- cost_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_profiles') THEN
    EXECUTE 'ALTER TABLE public.cost_profiles ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cost_profiles_select' AND tablename = 'cost_profiles') THEN
      EXECUTE 'CREATE POLICY "cost_profiles_select" ON public.cost_profiles FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cost_profiles_insert' AND tablename = 'cost_profiles') THEN
      EXECUTE 'CREATE POLICY "cost_profiles_insert" ON public.cost_profiles FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cost_profiles_update' AND tablename = 'cost_profiles') THEN
      EXECUTE 'CREATE POLICY "cost_profiles_update" ON public.cost_profiles FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cost_profiles_delete' AND tablename = 'cost_profiles') THEN
      EXECUTE 'CREATE POLICY "cost_profiles_delete" ON public.cost_profiles FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;

  -- quotes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotes') THEN
    EXECUTE 'ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotes_select' AND tablename = 'quotes') THEN
      EXECUTE 'CREATE POLICY "quotes_select" ON public.quotes FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotes_insert' AND tablename = 'quotes') THEN
      EXECUTE 'CREATE POLICY "quotes_insert" ON public.quotes FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotes_update' AND tablename = 'quotes') THEN
      EXECUTE 'CREATE POLICY "quotes_update" ON public.quotes FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quotes_delete' AND tablename = 'quotes') THEN
      EXECUTE 'CREATE POLICY "quotes_delete" ON public.quotes FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;

  -- quote_line_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_line_items') THEN
    EXECUTE 'ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_line_items_select' AND tablename = 'quote_line_items') THEN
      EXECUTE 'CREATE POLICY "quote_line_items_select" ON public.quote_line_items FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_line_items_insert' AND tablename = 'quote_line_items') THEN
      EXECUTE 'CREATE POLICY "quote_line_items_insert" ON public.quote_line_items FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_line_items_update' AND tablename = 'quote_line_items') THEN
      EXECUTE 'CREATE POLICY "quote_line_items_update" ON public.quote_line_items FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'quote_line_items_delete' AND tablename = 'quote_line_items') THEN
      EXECUTE 'CREATE POLICY "quote_line_items_delete" ON public.quote_line_items FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;

  -- app_settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_settings') THEN
    EXECUTE 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'app_settings_select' AND tablename = 'app_settings') THEN
      EXECUTE 'CREATE POLICY "app_settings_select" ON public.app_settings FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'app_settings_update' AND tablename = 'app_settings') THEN
      EXECUTE 'CREATE POLICY "app_settings_update" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.get_user_role()::text = ''owner'')';
    END IF;
  END IF;
END
$$;

GRANT ALL ON public.cost_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.quotes TO anon, authenticated, service_role;
GRANT ALL ON public.quote_line_items TO anon, authenticated, service_role;
GRANT ALL ON public.app_settings TO anon, authenticated, service_role;
