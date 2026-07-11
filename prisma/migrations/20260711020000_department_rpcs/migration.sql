-- RPC functions
-- Wrapped in DO blocks where they reference auth schema (Prisma shadow DB lacks it)

-- ═══════════════════════════════════════════════════════════════════════════════
-- Auth RPCs (require Supabase auth schema)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_user_role()
      RETURNS text
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $body$
        SELECT au.role::text
        FROM public.allowed_users au
        WHERE au.email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        LIMIT 1;
      $body$;
    $fn$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_user_department()
      RETURNS text
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $body$
        SELECT au.department::text
        FROM public.allowed_users au
        WHERE au.email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        LIMIT 1;
      $body$;
    $fn$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_allowed_user()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.allowed_users au
          WHERE au.email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        );
      $body$;
    $fn$;
  END IF;
END
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- complete_sale RPC
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- auto_logout_stale_sessions RPC
-- ═══════════════════════════════════════════════════════════════════════════════

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
