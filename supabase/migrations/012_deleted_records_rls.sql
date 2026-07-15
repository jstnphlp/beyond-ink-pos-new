-- RLS + restore RPC for the deleted_records trash table
-- Run after 011_activity_log.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS + Grants
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deleted_records') THEN
    EXECUTE 'ALTER TABLE public.deleted_records ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deleted_records_select' AND tablename = 'deleted_records') THEN
      EXECUTE 'CREATE POLICY "deleted_records_select" ON public.deleted_records FOR SELECT TO authenticated USING (public.is_allowed_user())';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'deleted_records_delete' AND tablename = 'deleted_records') THEN
      EXECUTE 'CREATE POLICY "deleted_records_delete" ON public.deleted_records FOR DELETE TO authenticated USING (public.is_allowed_user())';
    END IF;
  END IF;
END
$$;

GRANT SELECT, DELETE ON public.deleted_records TO authenticated;
GRANT ALL ON public.deleted_records TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC: restore_deleted_record(p_table_name, p_record_id)
-- Re-inserts the most recent matching row from deleted_records into the
-- original table, then removes the trash entry.
-- SECURITY DEFINER so it bypasses RLS on the target table during restore.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.restore_deleted_record(
  p_table_name text,
  p_record_id   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data jsonb;
  v_id   uuid;
BEGIN
  -- Validate table name (alphanumeric + underscores only)
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Grab the most recent trash entry
  SELECT dr.data, dr.id
    INTO v_data, v_id
  FROM public.deleted_records dr
  WHERE dr.table_name = p_table_name
    AND dr.record_id  = p_record_id
  ORDER BY dr.deleted_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'No deleted record found for table=%  recordId=%', p_table_name, p_record_id;
  END IF;

  -- Re-insert into the original table
  EXECUTE format(
    'INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1)',
    p_table_name, p_table_name
  ) USING v_data;

  -- Remove the trash entry
  DELETE FROM public.deleted_records WHERE id = v_id;
END;
$$;

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.restore_deleted_record(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_record(text, text) TO service_role;
