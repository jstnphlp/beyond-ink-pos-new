import pg from 'pg'

const DB_URL = 'postgresql://postgres:regLoyJr0rklVneu@db.aumycaatbxesgbkwxkno.supabase.co:5432/postgres'

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  // 1. Drop old text check constraint
  try {
    await client.query('ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check')
    console.log('Dropped old check constraint')
  } catch (err) {
    console.error('Drop constraint error:', err.message)
  }

  // 2. Convert movement_type column from text to enum
  try {
    await client.query(`
      ALTER TABLE public.inventory_movements
      ALTER COLUMN movement_type TYPE public."MovementType"
      USING movement_type::text::public."MovementType"
    `)
    console.log('Converted movement_type to enum')
  } catch (err) {
    console.error('Convert error:', err.message)
  }

  await client.end()
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
