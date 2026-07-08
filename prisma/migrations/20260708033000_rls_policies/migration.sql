-- RLS policies, grants, and auto-logout function
-- prisma migrate reset wipes schema-level grants, so they must be restored here

-- Schema-level grants for PostgREST (Supabase REST API)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- RLS on staff tables
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- Open policies for shared physical login (no auth)
CREATE POLICY "staff_members_select_all" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "staff_sessions_select_all" ON public.staff_sessions FOR SELECT USING (true);
CREATE POLICY "staff_sessions_insert_all" ON public.staff_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "staff_sessions_update_all" ON public.staff_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Auto-logout function: closes all open sessions at 9PM PHT
CREATE OR REPLACE FUNCTION public.auto_logout_staff()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.staff_sessions
  SET time_out = (CURRENT_DATE AT TIME ZONE 'Asia/Manila' + TIME '21:00:00') AT TIME ZONE 'Asia/Manila',
      auto_logged_out = true
  WHERE time_out IS NULL;
END;
$$;
