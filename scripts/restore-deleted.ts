// scripts/restore-deleted.ts
// Restores a soft-deleted row from the DeletedRecord trash table.
// Usage: npx tsx scripts/restore-deleted.ts <tableName> <recordId>

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const TABLE_RE = /^[a-z_][a-z0-9_]*$/;

async function main() {
  const [tableName, recordId] = process.argv.slice(2);

  if (!tableName || !recordId) {
    console.error(
      "Usage: npx tsx scripts/restore-deleted.ts <tableName> <recordId>"
    );
    console.error(
      "  tableName  — Postgres table name, e.g. sales_transactions"
    );
    console.error("  recordId   — the UUID of the deleted row");
    process.exit(1);
  }

  if (!TABLE_RE.test(tableName)) {
    console.error(`Invalid table name: "${tableName}"`);
    process.exit(1);
  }

  const tableExists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    tableName
  );

  if (!tableExists[0]?.exists) {
    console.error(`Table "${tableName}" does not exist in the database.`);
    process.exit(1);
  }

  const deleted = await prisma.deletedRecord.findFirst({
    where: { tableName, recordId },
    orderBy: { deletedAt: "desc" },
  });

  if (!deleted) {
    console.error(
      `No deleted record found for table="${tableName}" recordId="${recordId}".`
    );
    process.exit(1);
  }

  console.log(
    `Found deleted record from ${deleted.deletedAt.toISOString()}:`
  );
  console.log(JSON.stringify(deleted.data, null, 2));

  await prisma.$executeRawUnsafe(
    `INSERT INTO "${tableName}"
     SELECT * FROM jsonb_populate_record(null::"${tableName}", $1::jsonb)`,
    JSON.stringify(deleted.data)
  );

  console.log(
    `\nRestored ${tableName}/${recordId} successfully.`
  );
}

main()
  .catch((err) => {
    console.error("Restore failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
