import pg from 'pg'

const DB_URL = 'postgresql://postgres:regLoyJr0rklVneu@db.aumycaatbxesgbkwxkno.supabase.co:5432/postgres'

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  // Drop old functions that conflict
  console.log('Dropping old functions...')
  await client.query('DROP FUNCTION IF EXISTS public.get_user_role() CASCADE')
  await client.query('DROP FUNCTION IF EXISTS public.is_allowed_user() CASCADE')
  console.log('Done')

  await client.end()
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
