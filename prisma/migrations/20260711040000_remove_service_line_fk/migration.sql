-- Remove FK constraint from sales_service_lines.service_id
-- The POS uses mock service data from the store, so service_id may not exist in the services table

ALTER TABLE "sales_service_lines" DROP CONSTRAINT IF EXISTS "sales_service_lines_service_id_fkey";
