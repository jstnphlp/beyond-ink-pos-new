import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_URL = 'postgresql://postgres:regLoyJr0rklVneu@db.aumycaatbxesgbkwxkno.supabase.co:5432/postgres'

const STEPS = [
  // Step 1: Create enums and alter schema (no ADD VALUE)
  `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      CREATE TYPE public.user_role AS ENUM ('owner', 'staff');
    END IF;
  END
  $$;
  `,

  // Step 2: Fix allowed_users
  `
  ALTER TABLE public.allowed_users DROP CONSTRAINT IF EXISTS allowed_users_role_check;
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
  UPDATE public.allowed_users SET role = 'staff' WHERE role IN ('design_dept', 'physical_dept', 'dev_dept');
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'allowed_users' AND column_name = 'role' AND data_type = 'text'
    ) THEN
      ALTER TABLE public.allowed_users ALTER COLUMN role DROP DEFAULT;
      ALTER TABLE public.allowed_users ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
      ALTER TABLE public.allowed_users ALTER COLUMN role SET DEFAULT 'staff';
    END IF;
  END
  $$;
  `,

  // Step 3: Create staff_members and add staff_member_id
  `
  CREATE TABLE IF NOT EXISTS public.staff_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    department text DEFAULT 'physical_dept' NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
  );
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
  `,

  // Step 4: Create MovementType enum (no ADD VALUE yet)
  `
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MovementType') THEN
      CREATE TYPE public."MovementType" AS ENUM ('sale_deduction', 'manual_adjustment', 'purchase_receipt');
    END IF;
  END
  $$;
  `,

  // Step 5: Add enum values (must be outside transaction)
  'ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS \'sale_deduction\';',
  'ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS \'manual_adjustment\';',
  'ALTER TYPE public."MovementType" ADD VALUE IF NOT EXISTS \'purchase_receipt\';',

  // Step 6: Convert movement_type column
  `
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
  `,

  // Step 7: Seed allowed_users
  `
  INSERT INTO allowed_users (email, name, role) VALUES
    ('justinphilipmartinez@gmail.com', 'Justin Martinez', 'owner'),
    ('beyond.ink.ph@gmail.com', 'Beyond Ink Staff', 'staff')
  ON CONFLICT (email) DO NOTHING;
  `,
]

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  for (let i = 0; i < STEPS.length; i++) {
    const sql = STEPS[i].trim()
    if (!sql) continue
    console.log(`Step ${i + 1}/${STEPS.length}...`)
    try {
      await client.query(sql)
    } catch (err) {
      console.error(`  Error on step ${i + 1}:`, err.message)
      // Continue on "already exists" type errors
      if (!err.message.includes('already exists') &&
          !err.message.includes('duplicate_object') &&
          !err.message.includes('IF NOT EXISTS')) {
        throw err
      }
      console.log('  (skipped - already applied)')
    }
  }

  console.log('\nMigration complete!')
  await client.end()
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})
