-- Check what exists in old DB
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'inventory_movements' AND column_name = 'movement_type';
