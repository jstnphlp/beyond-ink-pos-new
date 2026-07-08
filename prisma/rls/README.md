# Row Level Security (RLS) Policies

This directory is a placeholder for RLS SQL policies applied via Supabase CLI or Supabase Studio.

**RLS policies are NOT managed by Prisma.** They are written as raw SQL and kept separate from Prisma migrations.

## How to apply RLS policies

1. Write the SQL policy in a `.sql` file in this directory
2. Apply via Supabase CLI: `npx supabase db execute --file ./prisma/rls/your-policy.sql`
3. Or apply via Supabase Studio at http://127.0.0.1:54323

## Convention

Name files with a numeric prefix for ordering: `001_enable_rls_products.sql`, etc.
