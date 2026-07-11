-- Costing: cost_profiles, quotes, quote_line_items, app_settings
-- Run after 006_services_catalog.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add missing is_active column to inventory_items
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.inventory_items ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END
$$;

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
-- Looks up service/material IDs by name so it works regardless of generated UUIDs
-- ═══════════════════════════════════════════════════════════════════════════════

-- Standard Printing (Black)
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Standard Printing (Black)', 'Standard Short Bondpaper', 0.47, 1.00),
  ('Standard Printing (Black)', 'Standard Long Bondpaper',  0.57, 1.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Standard Printing (Colored)
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Standard Printing (Colored)', 'Colored Short Bondpaper', 0.47, 2.00),
  ('Standard Printing (Colored)', 'Colored Long Bondpaper',  0.57, 2.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Photo Printing
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('2R Photo Print',  'Photo Paper Glossy 2R',  0.33, 1.00),
  ('3R Photo Print',  'Photo Paper Glossy 3R',  4.10, 3.00),
  ('4R Photo Print',  'Photo Paper Glossy 4R',  4.15, 3.00),
  ('A4 Photo Print',  'Photo Paper Glossy A4',  8.70, 5.00),
  ('A4 Photo Print',  'Photo Paper Matte A4',   8.70, 5.00),
  ('Rush ID',         'ID Photo Paper',          4.15, 3.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Stickers
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Custom Stickers/Labels', 'Sticker Paper Glossy A4', 4.36, 5.00),
  ('Custom Stickers/Labels', 'Sticker Paper Matte A4',  6.40, 5.00),
  ('Custom Stickers/Labels', 'Sticker Paper Vinyl A4',  9.10, 5.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Sintra Board
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, 35.40, 5.00
FROM public.services s, public.inventory_items m
WHERE s.name = 'Sticker on Sintra Board' AND m.name = 'Sintra Board A4'
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Laminating
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Hot Laminating',  'Laminating Film ID Size',   1.40, 1.00),
  ('Hot Laminating',  'Laminating Film Half Size',  6.50, 1.00),
  ('Hot Laminating',  'Laminating Film A4',         1.69, 1.00),
  ('Phototop/Coldtop','Coldtop Film A4',            9.00, 0.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Certificates & Awards
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Certificates & Award', 'Certificate Paper Specialty', 8.40, 4.00),
  ('Certificates & Award', 'Certificate Paper Parchment', 2.75, 4.00),
  ('Certificates & Award', 'Certificate Paper Linen',     5.50, 4.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Flyers & Brochures
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Flyers/Tri-Fold Brochures', 'Brochure Paper A4', 3.54, 5.00),
  ('Flyers/Tri-Fold Brochures', 'Flyer Paper A4',    3.54, 5.00),
  ('Flyers/Tri-Fold Brochures', 'Inkjet Paper A4',   1.69, 5.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Business Cards & Invitation Cards
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Business Cards',    'Business Card Paper',    4.00, 5.00),
  ('Invitation Card',   'Invitation Card Paper',  2.00, 5.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Magazines
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Magazine (A4, Colored)', 'C2S Paper 120gsm A4', 3.54, 5.00),
  ('Magazine (A5, Colored)', 'C2S Paper 120gsm A5', 2.00, 1.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
ON CONFLICT (service_id, inventory_item_id) DO UPDATE SET material_cost = EXCLUDED.material_cost, ink_cost = EXCLUDED.ink_cost;

-- Book Binding
INSERT INTO public.cost_profiles (service_id, inventory_item_id, material_cost, ink_cost)
SELECT s.id, m.id, v.mat, v.ink
FROM (VALUES
  ('Staple Binding',       'Staple Wire',          12.00, 0.00),
  ('Spiral/Coil Binding',  'Spiral Coil',          15.00, 0.00),
  ('Tape Binding',         'Tape Binding Strip',   10.00, 0.00),
  ('Hard-Bound Binding',   'Book Board (Hardbound)',80.00, 0.00)
) AS v(svc_name, mat_name, mat, ink)
JOIN public.services s ON s.name = v.svc_name
JOIN public.inventory_items m ON m.name = v.mat_name
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
