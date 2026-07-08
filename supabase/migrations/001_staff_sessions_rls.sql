-- Staff sessions RLS policies + auto-logout function
-- Run this after the Prisma migration has created the tables

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS Policies — open access for shared physical login (no auth)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- staff_members: full read access (staff list for clock-in UI)
CREATE POLICY "staff_members_select_all"
ON public.staff_members FOR SELECT
USING (true);

-- staff_sessions: full read/write (clock in/out, attendance queries)
CREATE POLICY "staff_sessions_select_all"
ON public.staff_sessions FOR SELECT
USING (true);

CREATE POLICY "staff_sessions_insert_all"
ON public.staff_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "staff_sessions_update_all"
ON public.staff_sessions FOR UPDATE
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Auto-logout function — closes all open sessions at 9PM PHT
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- pg_cron schedule — runs at 1:00 PM UTC (= 9:00 PM PHT)
-- Requires: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Run manually: SELECT cron.schedule('auto-logout-staff', '0 13 * * *', 'SELECT public.auto_logout_staff()');
-- ═══════════════════════════════════════════════════════════════════════════════
