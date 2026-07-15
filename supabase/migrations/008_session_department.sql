-- Add department to staff_sessions + make staff_member_id nullable for owner ad-hoc sessions
-- Run after 007_costing.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add department column
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.staff_sessions
  ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'physical_dept';

CREATE INDEX IF NOT EXISTS idx_staff_sessions_department
  ON public.staff_sessions(department);

-- Backfill existing sessions from staff_members
UPDATE public.staff_sessions ss
SET department = sm.department
FROM public.staff_members sm
WHERE ss.staff_member_id = sm.id
  AND ss.department = 'physical_dept';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Make staff_member_id nullable (for owner ad-hoc sessions)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.staff_sessions
  ALTER COLUMN staff_member_id DROP NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add note column (owner reflection on clock-out)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.staff_sessions
  ADD COLUMN IF NOT EXISTS note TEXT;
