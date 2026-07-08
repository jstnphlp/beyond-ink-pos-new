// scripts/setup-db.mjs
// Resets local Supabase, pushes Prisma schema, applies RLS, and seeds data.
// Usage: node scripts/setup-db.mjs

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function run(cmd) {
  console.log(`\n▸ ${cmd}`)
  execSync(cmd, { cwd: root, stdio: 'inherit' })
}

async function executeSqlFile(client, filePath) {
  const sql = readFileSync(filePath, 'utf-8')
  console.log(`  Executing ${filePath.split(/[\\/]/).pop()}...`)
  await client.query(sql)
}

async function main() {
  // 1. Reset Supabase (migrations run, skip table-specific stuff gracefully)
  run('npx supabase db reset --no-seed')

  // 2. Push Prisma schema (creates tables)
  run('npx prisma db push')

  // 3. Re-apply RLS migrations + seed via direct connection
  const client = new pg.Client({ connectionString: DB_URL })
  await client.connect()

  try {
    await executeSqlFile(client, resolve(root, 'supabase/migrations/001_staff_sessions_rls.sql'))
    await executeSqlFile(client, resolve(root, 'supabase/migrations/002_auth_allowed_users.sql'))
    await executeSqlFile(client, resolve(root, 'supabase/seed.sql'))
    console.log('\n✔ Database setup complete!')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\n✘ Setup failed:', err.message)
  process.exit(1)
})
