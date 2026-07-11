import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import pg from 'pg'

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const sqlPath = resolve(import.meta.dirname, '..', 'supabase', 'seed.sql')
  const sql = readFileSync(sqlPath, 'utf-8')
  await client.query(sql)
  console.log('Seed applied')
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
