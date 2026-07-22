-- Sample seed for distribution_payouts (per-staff)
-- Run AFTER applying migration 017_distribution_payouts_per_staff.sql
-- This uses staff names to look up IDs, so it works regardless of UUIDs

-- Week of Jul 12–18, 2026
INSERT INTO distribution_payouts (staff_member_id, staff_name, department, period_from, period_to, amount, given, given_at)
SELECT sm.id, sm.name, sm.department,
       '2026-07-12T00:00:00.000Z'::timestamptz,
       '2026-07-18T23:59:59.999Z'::timestamptz,
       CASE sm.name
         WHEN 'Mark' THEN 1230.00
         WHEN 'Buknoy' THEN 1150.50
         WHEN 'Ava' THEN 980.75
         WHEN 'Leo' THEN 1050.25
         ELSE 500.00
       END,
       false,
       NULL
FROM staff_members sm
WHERE sm.is_active = true
ON CONFLICT (staff_member_id, department, period_from, period_to) DO NOTHING;

-- Mark one staff as paid (Mark)
UPDATE distribution_payouts
SET given = true, given_at = now()
WHERE staff_name = 'Mark'
  AND period_from = '2026-07-12T00:00:00.000Z'
  AND period_to = '2026-07-18T23:59:59.999Z';

-- Week of Jul 5–11, 2026 (all unpaid)
INSERT INTO distribution_payouts (staff_member_id, staff_name, department, period_from, period_to, amount, given, given_at)
SELECT sm.id, sm.name, sm.department,
       '2026-07-05T00:00:00.000Z'::timestamptz,
       '2026-07-11T23:59:59.999Z'::timestamptz,
       CASE sm.name
         WHEN 'Mark' THEN 1100.00
         WHEN 'Buknoy' THEN 1080.00
         WHEN 'Ava' THEN 920.00
         WHEN 'Leo' THEN 990.00
         ELSE 450.00
       END,
       false,
       NULL
FROM staff_members sm
WHERE sm.is_active = true
ON CONFLICT (staff_member_id, department, period_from, period_to) DO NOTHING;
