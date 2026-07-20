-- Add quantity and unit_price columns to sales_service_lines
ALTER TABLE "sales_service_lines" ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1;
ALTER TABLE "sales_service_lines" ADD COLUMN IF NOT EXISTS "unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill quantity from material entries
UPDATE sales_service_lines ssl
SET quantity = COALESCE(
  (SELECT MAX(sme.quantity) FROM sales_material_entries sme WHERE sme.service_line_id = ssl.id),
  1
);

-- Backfill unit_price from services.base_price (best effort)
UPDATE sales_service_lines ssl
SET unit_price = COALESCE(
  (SELECT s.base_price FROM services s WHERE s.id = ssl.service_id),
  0
);

-- Update complete_sale RPC to store service price and quantity per service line
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
      transaction_id, service_id, service_name, sort_order, quantity, unit_price
    ) VALUES (
      v_txn_id,
      (v_service->>'serviceId')::uuid,
      v_service->>'serviceName',
      (v_service->>'sortOrder')::int,
      (v_service->>'quantity')::numeric,
      (v_service->>'unitPrice')::numeric
    )
    RETURNING id INTO v_line_id;

    -- Support new "materials" array
    IF v_service->'materials' IS NOT NULL AND jsonb_array_length(v_service->'materials') > 0 THEN
      FOR v_material IN SELECT * FROM jsonb_array_elements(v_service->'materials')
      LOOP
        INSERT INTO sales_material_entries (
          service_line_id, inventory_item_id, material_name, quantity, unit_price
        ) VALUES (
          v_line_id,
          (v_material->>'id')::uuid,
          v_material->>'name',
          (v_service->>'quantity')::numeric,
          (v_material->>'costPerUnit')::numeric
        );
      END LOOP;
    -- Backward compat: support old single "material" object
    ELSIF v_service->'material' IS NOT NULL AND v_service->'material' != 'null'::jsonb THEN
      v_material := v_service->'material';
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
