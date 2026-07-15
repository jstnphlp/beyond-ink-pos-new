-- Add missing columns to inventory_items
-- stock_on_hand, low_stock_threshold, cost_per_unit exist in deploy.sql / Prisma
-- but were never added via Supabase migrations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'stock_on_hand'
  ) THEN
    ALTER TABLE public.inventory_items ADD COLUMN stock_on_hand numeric(10,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE public.inventory_items ADD COLUMN low_stock_threshold numeric(10,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'cost_per_unit'
  ) THEN
    ALTER TABLE public.inventory_items ADD COLUMN cost_per_unit numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END
$$;
