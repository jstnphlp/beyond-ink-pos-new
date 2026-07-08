-- Safe migration for old database -> new Prisma schema
-- No data will be lost

-- 1. Create user_role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('owner', 'staff');
  END IF;
END
$$;

-- 2. Fix allowed_users: drop old check, update values, convert to enum
-- Drop old check constraint
ALTER TABLE public.allowed_users DROP CONSTRAINT IF EXISTS allowed_users_role_check;

-- Add name column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'allowed_users' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.allowed_users ADD COLUMN name text;
  END IF;
END
$$;

-- Convert old department roles to staff
UPDATE public.allowed_users SET role = 'staff'
WHERE role IN ('design_dept', 'physical_dept', 'dev_dept');

-- Convert role column to enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'allowed_users' AND column_name = 'role' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.allowed_users ALTER COLUMN role DROP DEFAULT;
    ALTER TABLE public.allowed_users
      ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
    ALTER TABLE public.allowed_users ALTER COLUMN role SET DEFAULT 'staff';
  END IF;
END
$$;

-- 3. Create staff_members table if missing
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  department text DEFAULT 'physical_dept' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Add staff_member_id to staff_sessions (nullable for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'staff_sessions' AND column_name = 'staff_member_id'
  ) THEN
    ALTER TABLE public.staff_sessions ADD COLUMN staff_member_id uuid REFERENCES public.staff_members(id);
  END IF;
END
$$;

-- 5. Create MovementType enum if missing, then populate values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MovementType') THEN
    CREATE TYPE public."MovementType" AS ENUM ('sale_deduction', 'manual_adjustment', 'purchase_receipt');
  END IF;
END
$$;

-- Ensure values exist (ignore errors if they already do)
ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS 'sale_deduction';
ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS 'manual_adjustment';
ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS 'purchase_receipt';

-- 6. Convert movement_type column from text to enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_movements' AND column_name = 'movement_type' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.inventory_movements
      ALTER COLUMN movement_type TYPE public."MovementType"
      USING movement_type::public."MovementType";
  END IF;
END
$$;

-- 7. Seed allowed_users
INSERT INTO allowed_users (email, name, role) VALUES
  ('justinphilipmartinez@gmail.com', 'Justin Martinez', 'owner'),
  ('beyond.ink.ph@gmail.com', 'Beyond Ink Staff', 'staff')
ON CONFLICT (email) DO NOTHING;
