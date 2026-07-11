-- Seed initial staff members
INSERT INTO public.staff_members (name, department) VALUES
  ('Juan Carlos', 'physical_dept'),
  ('Ana Martinez', 'physical_dept'),
  ('Rico Mendoza', 'physical_dept'),
  ('Kim Santos', 'physical_dept')
ON CONFLICT (name) DO NOTHING;
