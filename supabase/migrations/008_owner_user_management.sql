-- Owner-level management of allowed_users
-- Run after 007_allowed_user_department.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS: Allow owners to manage all allowed_users rows
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'allowed_users') THEN
    EXECUTE 'ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY';

    -- Owners can select all rows
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allowed_users_select_owner' AND tablename = 'allowed_users') THEN
      EXECUTE 'CREATE POLICY "allowed_users_select_owner" ON public.allowed_users FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.allowed_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND role = ''owner'')
      )';
    END IF;

    -- Owners can insert
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allowed_users_insert_owner' AND tablename = 'allowed_users') THEN
      EXECUTE 'CREATE POLICY "allowed_users_insert_owner" ON public.allowed_users FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.allowed_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND role = ''owner'')
      )';
    END IF;

    -- Owners can update
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allowed_users_update_owner' AND tablename = 'allowed_users') THEN
      EXECUTE 'CREATE POLICY "allowed_users_update_owner" ON public.allowed_users FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.allowed_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND role = ''owner'')
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.allowed_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND role = ''owner'')
      )';
    END IF;

    -- Owners can delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allowed_users_delete_owner' AND tablename = 'allowed_users') THEN
      EXECUTE 'CREATE POLICY "allowed_users_delete_owner" ON public.allowed_users FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.allowed_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND role = ''owner'')
      )';
    END IF;
  END IF;
END
$$;
