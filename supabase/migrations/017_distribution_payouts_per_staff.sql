-- Update distribution_payouts unique constraint to be per-staff
-- This allows tracking paid status individually per staff member

-- Drop the old department-level unique constraint
ALTER TABLE public.distribution_payouts
  DROP CONSTRAINT IF EXISTS distribution_payouts_department_period_from_period_to_key;

-- Add new per-staff unique constraint
ALTER TABLE public.distribution_payouts
  ADD CONSTRAINT distribution_payouts_staff_dept_period_key
  UNIQUE (staff_member_id, department, period_from, period_to);
