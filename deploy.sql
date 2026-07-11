-- Beyond Ink POS - Full Database Deploy
-- Drops old schema and recreates from scratch

-- ═══════════════════════════════════════════════════════════════════════════════
-- Drop everything (reverse dependency order)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "distribution_payouts" CASCADE;
DROP TABLE IF EXISTS "transaction_contributors" CASCADE;
DROP TABLE IF EXISTS "staff_sessions" CASCADE;
DROP TABLE IF EXISTS "sales_add_on_entries" CASCADE;
DROP TABLE IF EXISTS "sales_material_entries" CASCADE;
DROP TABLE IF EXISTS "sales_service_lines" CASCADE;
DROP TABLE IF EXISTS "sales_transactions" CASCADE;
DROP TABLE IF EXISTS "service_material_prices" CASCADE;
DROP TABLE IF EXISTS "add_ons" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "service_categories" CASCADE;
DROP TABLE IF EXISTS "inventory_movements" CASCADE;
DROP TABLE IF EXISTS "inventory_items" CASCADE;
DROP TABLE IF EXISTS "staff_members" CASCADE;
DROP TABLE IF EXISTS "allowed_users" CASCADE;

DROP TYPE IF EXISTS "user_department" CASCADE;
DROP TYPE IF EXISTS "user_role" CASCADE;
DROP TYPE IF EXISTS "MovementType" CASCADE;
DROP TYPE IF EXISTS "DiscountType" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "TransactionStatus" CASCADE;

DROP FUNCTION IF EXISTS complete_sale CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;
DROP FUNCTION IF EXISTS get_user_department CASCADE;
DROP FUNCTION IF EXISTS is_allowed_user CASCADE;
DROP FUNCTION IF EXISTS auto_logout_stale_sessions CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Enums
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE "TransactionStatus" AS ENUM ('draft', 'completed', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'gcash');
CREATE TYPE "DiscountType" AS ENUM ('fixed', 'percentage');
CREATE TYPE "MovementType" AS ENUM ('sale_deduction', 'manual_adjustment', 'purchase_receipt');
CREATE TYPE "user_role" AS ENUM ('owner', 'staff');
CREATE TYPE "user_department" AS ENUM ('physical_dept', 'design_dept', 'dev_dept');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "allowed_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'staff',
    "department" "user_department",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "allowed_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'sheet',
    "stock_on_hand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "low_stock_threshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost_per_unit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_number" BIGINT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'draft',
    "cashier_name" TEXT NOT NULL,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "customer_name" TEXT,
    "delivery_address" TEXT,
    "drop_off_location" TEXT,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_type" "DiscountType",
    "discount_value" DECIMAL(10,2),
    "draft_payload" JSONB NOT NULL DEFAULT '{}',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod",
    "cash_received" DECIMAL(10,2),
    "gcash_amount_paid" DECIMAL(10,2),
    "change_due" DECIMAL(10,2),
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" UUID NOT NULL,
    "transaction_id" UUID,
    "movement_type" "MovementType" NOT NULL,
    "quantity_delta" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "icon" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category_id" UUID,
    "description" TEXT NOT NULL DEFAULT '',
    "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "add_ons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "add_ons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_material_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "suggested_unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_material_prices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_service_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "service_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_service_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_material_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_line_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "material_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_material_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_add_on_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_entry_id" UUID NOT NULL,
    "add_on_id" UUID NOT NULL,
    "add_on_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_add_on_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_member_id" UUID NOT NULL,
    "staff_name" TEXT NOT NULL,
    "time_in" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_out" TIMESTAMPTZ,
    "auto_logged_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transaction_contributors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "staff_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_contributors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "distribution_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_member_id" UUID,
    "staff_name" TEXT,
    "department" TEXT NOT NULL,
    "period_from" TIMESTAMPTZ NOT NULL,
    "period_to" TIMESTAMPTZ NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "given" BOOLEAN NOT NULL DEFAULT false,
    "given_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "distribution_payouts_pkey" PRIMARY KEY ("id")
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX "allowed_users_email_key" ON "allowed_users"("email");
CREATE UNIQUE INDEX "sales_transactions_transaction_number_key" ON "sales_transactions"("transaction_number");
CREATE UNIQUE INDEX "staff_members_name_key" ON "staff_members"("name");
CREATE INDEX "staff_sessions_staff_member_id_time_in_idx" ON "staff_sessions"("staff_member_id", "time_in");
CREATE INDEX "staff_sessions_time_out_time_in_idx" ON "staff_sessions"("time_out", "time_in");
CREATE INDEX "transaction_contributors_transaction_id_idx" ON "transaction_contributors"("transaction_id");
CREATE INDEX "transaction_contributors_staff_member_id_idx" ON "transaction_contributors"("staff_member_id");
CREATE INDEX "distribution_payouts_staff_member_id_idx" ON "distribution_payouts"("staff_member_id");
CREATE INDEX "distribution_payouts_period_from_period_to_idx" ON "distribution_payouts"("period_from", "period_to");
CREATE INDEX "distribution_payouts_department_idx" ON "distribution_payouts"("department");
CREATE UNIQUE INDEX "distribution_payouts_department_period_from_period_to_key" ON "distribution_payouts"("department", "period_from", "period_to");

-- ═══════════════════════════════════════════════════════════════════════════════
-- Foreign Keys
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_material_prices" ADD CONSTRAINT "service_material_prices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_material_prices" ADD CONSTRAINT "service_material_prices_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_service_lines" ADD CONSTRAINT "sales_service_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_material_entries" ADD CONSTRAINT "sales_material_entries_service_line_id_fkey" FOREIGN KEY ("service_line_id") REFERENCES "sales_service_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_add_on_entries" ADD CONSTRAINT "sales_add_on_entries_material_entry_id_fkey" FOREIGN KEY ("material_entry_id") REFERENCES "sales_material_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_add_on_entries" ADD CONSTRAINT "sales_add_on_entries_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_ons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction_contributors" ADD CONSTRAINT "transaction_contributors_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_contributors" ADD CONSTRAINT "transaction_contributors_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distribution_payouts" ADD CONSTRAINT "distribution_payouts_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC Functions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT au.role::text
  FROM public.allowed_users au
  WHERE au.email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT au.department::text
  FROM public.allowed_users au
  WHERE au.email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_users au
    WHERE au.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
$$;

CREATE OR REPLACE FUNCTION complete_sale(
  p_services JSONB,
  p_delivery_enabled BOOLEAN,
  p_customer_name TEXT,
  p_delivery_address TEXT,
  p_delivery_fee NUMERIC,
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_subtotal NUMERIC,
  p_final_total NUMERIC,
  p_payment_method TEXT,
  p_cash_received NUMERIC,
  p_gcash_amount_paid NUMERIC,
  p_change_due NUMERIC,
  p_cashier_name TEXT DEFAULT 'Staff',
  p_department TEXT DEFAULT 'physical_dept'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_txn_id UUID;
  v_line_id UUID;
  v_service JSONB;
  v_material JSONB;
  v_txn_number BIGINT;
BEGIN
  v_txn_number := (EXTRACT(EPOCH FROM now()) * 1000000 + (random() * 1000)::int)::bigint;

  INSERT INTO sales_transactions (
    transaction_number, status, cashier_name,
    delivery_enabled, customer_name, delivery_address, delivery_fee,
    discount_type, discount_value,
    subtotal, final_total,
    payment_method, cash_received, gcash_amount_paid, change_due,
    completed_at, updated_at, department
  ) VALUES (
    v_txn_number, 'completed', p_cashier_name,
    p_delivery_enabled, p_customer_name, p_delivery_address, p_delivery_fee,
    p_discount_type::"DiscountType", p_discount_value,
    p_subtotal, p_final_total,
    p_payment_method::"PaymentMethod", p_cash_received, p_gcash_amount_paid, p_change_due,
    now(), now(), p_department
  )
  RETURNING id INTO v_txn_id;

  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    INSERT INTO sales_service_lines (
      transaction_id, service_id, service_name, sort_order
    ) VALUES (
      v_txn_id,
      (v_service->>'serviceId')::uuid,
      v_service->>'serviceName',
      (v_service->>'sortOrder')::int
    )
    RETURNING id INTO v_line_id;

    v_material := v_service->'material';

    IF v_material IS NOT NULL AND v_material != 'null'::jsonb THEN
      INSERT INTO sales_material_entries (
        service_line_id, inventory_item_id, material_name, quantity, unit_price
      ) VALUES (
        v_line_id,
        (v_material->>'id')::uuid,
        v_material->>'name',
        (v_service->>'quantity')::numeric,
        (v_material->>'pricePerUnit')::numeric
      );
    END IF;
  END LOOP;

  RETURN v_txn_id;
END;
$$;

CREATE OR REPLACE FUNCTION auto_logout_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE staff_sessions
  SET time_out = (date_trunc('day', time_in) + INTERVAL '13 hours'),
      auto_logged_out = true
  WHERE time_out IS NULL
    AND time_in < (now() - INTERVAL '12 hours');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Grants (PostgREST)
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
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- allowed_users
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allowed_users_select_owner" ON public.allowed_users FOR SELECT TO authenticated USING (public.get_user_role() = 'owner');
CREATE POLICY "allowed_users_insert_owner" ON public.allowed_users FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'owner');
CREATE POLICY "allowed_users_update_owner" ON public.allowed_users FOR UPDATE TO authenticated USING (public.get_user_role() = 'owner') WITH CHECK (public.get_user_role() = 'owner');
CREATE POLICY "allowed_users_delete_owner" ON public.allowed_users FOR DELETE TO authenticated USING (public.get_user_role() = 'owner');

-- staff_members
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_members_select" ON public.staff_members FOR SELECT TO authenticated USING (public.is_allowed_user());

-- staff_sessions
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_sessions_select" ON public.staff_sessions FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "staff_sessions_insert" ON public.staff_sessions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "staff_sessions_update" ON public.staff_sessions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

-- service_categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_categories_select" ON public.service_categories FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "service_categories_insert" ON public.service_categories FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "service_categories_update" ON public.service_categories FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

-- add_ons
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "add_ons_select" ON public.add_ons FOR SELECT TO authenticated USING (public.is_allowed_user());

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

-- inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "inventory_movements_insert" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());

-- service_material_prices
ALTER TABLE public.service_material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_material_prices_select" ON public.service_material_prices FOR SELECT TO authenticated USING (public.is_allowed_user());

-- sales_transactions
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_transactions_select" ON public.sales_transactions FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "sales_transactions_insert" ON public.sales_transactions FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "sales_transactions_update" ON public.sales_transactions FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "sales_transactions_delete" ON public.sales_transactions FOR DELETE TO authenticated USING (public.is_allowed_user());

-- sales_service_lines
ALTER TABLE public.sales_service_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_service_lines_select" ON public.sales_service_lines FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "sales_service_lines_insert" ON public.sales_service_lines FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());

-- sales_material_entries
ALTER TABLE public.sales_material_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_material_entries_select" ON public.sales_material_entries FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "sales_material_entries_insert" ON public.sales_material_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());

-- sales_add_on_entries
ALTER TABLE public.sales_add_on_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_add_on_entries_select" ON public.sales_add_on_entries FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "sales_add_on_entries_insert" ON public.sales_add_on_entries FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO allowed_users (email, name, role, department) VALUES
  ('justinphilipmartinez@gmail.com', 'Justin Martinez', 'owner', NULL),
  ('beyond.ink.ph@gmail.com', 'Beyond Ink Staff', 'staff', 'physical_dept')
ON CONFLICT (email) DO NOTHING;

INSERT INTO staff_members (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Mark', 'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000002', 'Buknoy', 'physical_dept', true)
ON CONFLICT (name) DO NOTHING;
