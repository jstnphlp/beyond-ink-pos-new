-- Atomic soft-delete RPC for transactions
-- Saves transaction + children to deleted_records, then deletes in FK-safe order
-- SECURITY DEFINER bypasses RLS on all involved tables

CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_by text;
  v_txn        jsonb;
  v_lines      jsonb;
  v_entries    jsonb;
  v_line       jsonb;
  v_entry      jsonb;
BEGIN
  -- Who is deleting
  SELECT public.get_user_role() INTO v_deleted_by;

  -- Fetch the transaction row as JSON
  SELECT to_jsonb(t) INTO v_txn
  FROM public.sales_transactions t
  WHERE t.id = p_transaction_id;

  IF v_txn IS NULL THEN
    RAISE EXCEPTION 'Transaction % not found', p_transaction_id;
  END IF;

  -- Fetch service lines
  SELECT coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) INTO v_lines
  FROM public.sales_service_lines l
  WHERE l.transaction_id = p_transaction_id;

  -- Fetch material entries for those lines
  SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) INTO v_entries
  FROM public.sales_material_entries m
  WHERE m.service_line_id IN (
    SELECT l.id FROM public.sales_service_lines l
    WHERE l.transaction_id = p_transaction_id
  );

  -- Save to trash
  INSERT INTO public.deleted_records (table_name, record_id, data, deleted_by)
  VALUES ('sales_transactions', p_transaction_id::text, v_txn, v_deleted_by);

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
  LOOP
    INSERT INTO public.deleted_records (table_name, record_id, data, deleted_by)
    VALUES ('sales_service_lines', v_line->>'id', v_line, v_deleted_by);
  END LOOP;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(v_entries)
  LOOP
    INSERT INTO public.deleted_records (table_name, record_id, data, deleted_by)
    VALUES ('sales_material_entries',
            v_entry->>'service_line_id' || ':' || coalesce(v_entry->>'material_name', ''),
            v_entry, v_deleted_by);
  END LOOP;

  -- Delete in FK-safe order: entries → lines → transaction
  DELETE FROM public.sales_material_entries
  WHERE service_line_id IN (
    SELECT l.id FROM public.sales_service_lines l
    WHERE l.transaction_id = p_transaction_id
  );

  DELETE FROM public.sales_service_lines
  WHERE transaction_id = p_transaction_id;

  DELETE FROM public.sales_transactions
  WHERE id = p_transaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transaction(uuid) TO service_role;
