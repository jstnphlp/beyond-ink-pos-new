-- Remove FK constraint from sales_material_entries.inventory_item_id
-- The POS uses mock material data from the store, so inventory_item_id may not exist in the inventory_items table

ALTER TABLE "sales_material_entries" DROP CONSTRAINT IF EXISTS "sales_material_entries_inventory_item_id_fkey";
