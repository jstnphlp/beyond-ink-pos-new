-- Seed allowed_users
INSERT INTO allowed_users (email, name, role) VALUES
  ('justinphilipmartinez@gmail.com', 'Justin Martinez', 'owner'),
  ('beyond.ink.ph@gmail.com', 'Beyond Ink Staff', 'staff')
ON CONFLICT (email) DO NOTHING;
