-- Seed allowed_users
INSERT INTO allowed_users (email, name, role, department) VALUES
  ('justinphilipmartinez@gmail.com', 'Justin Martinez', 'owner', NULL),
  ('beyond.ink.ph@gmail.com', 'Beyond Ink Staff', 'staff', 'physical_dept')
ON CONFLICT (email) DO NOTHING;

-- Seed staff members
INSERT INTO staff_members (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Mark', 'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000002', 'Buknoy', 'physical_dept', true)
ON CONFLICT (name) DO NOTHING;
