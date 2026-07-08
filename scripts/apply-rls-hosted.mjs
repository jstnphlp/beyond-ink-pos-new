import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_URL = 'postgresql://postgres:regLoyJr0rklVneu@db.aumycaatbxesgbkwxkno.supabase.co:5432/postgres'

async function runFile(client, filePath) {
  const sql = readFileSync(filePath, 'utf-8')
  const name = filePath.split(/[\\/]/).pop()
  console.log(`Running ${name}...`)
  await client.query(sql)
  console.log(`  Done`)
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  const root = resolve(__dirname, '..')

  await runFile(client, resolve(root, 'supabase/migrations/001_staff_sessions_rls.sql'))
  await runFile(client, resolve(root, 'supabase/migrations/002_auth_allowed_users.sql'))

  console.log('\nAll done!')
  await client.end()
}

main().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
