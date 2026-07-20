-- DIAGNOSTIC: Run this in Supabase SQL Editor to see what's going on

-- 1. Check if columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'sales_service_lines' 
AND column_name IN ('quantity', 'unit_price');

-- 2. Check actual data for a recent transaction
SELECT 
  ssl.service_name, 
  ssl.quantity as line_qty, 
  ssl.unit_price as line_price,
  sme.quantity as entry_qty, 
  sme.material_name,
  st.subtotal,
  st.transaction_number
FROM sales_service_lines ssl
JOIN sales_transactions st ON st.id = ssl.transaction_id
LEFT JOIN sales_material_entries sme ON sme.service_line_id = ssl.id
ORDER BY ssl.created_at DESC
LIMIT 20;

-- 3. Check which version of complete_sale is active
SELECT prosrc FROM pg_proc WHERE proname = 'complete_sale';
