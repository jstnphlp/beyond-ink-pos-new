-- Make staff_member_id nullable for week-level given tracking
-- Run after 004_distribution_payouts.sql

ALTER TABLE public.distribution_payouts
  ALTER COLUMN staff_member_id DROP NOT NULL;

ALTER TABLE public.distribution_payouts
  ALTER COLUMN staff_name DROP NOT NULL;

-- Drop the old unique constraint (includes staff_member_id)
ALTER TABLE public.distribution_payouts
  DROP CONSTRAINT IF EXISTS distribution_payouts_staff_member_id_department_period_from_period_to_key;

-- Add new unique constraint on (department, period_from, period_to) for week-level tracking
ALTER TABLE public.distribution_payouts
  ADD CONSTRAINT distribution_payouts_dept_period_key
  UNIQUE (department, period_from, period_to);
