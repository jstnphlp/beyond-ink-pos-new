-- Staff time tracking migration
-- Creates staff_members table and adds FK to staff_sessions

-- 1. Create staff_members table
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_members_name_key" ON "staff_members"("name");

-- 2. Seed staff_members from existing staff_sessions data (if any)
INSERT INTO "staff_members" ("name")
SELECT DISTINCT "staff_name" FROM "staff_sessions"
ON CONFLICT ("name") DO NOTHING;

-- 3. Add staff_member_id as nullable first
ALTER TABLE "staff_sessions" ADD COLUMN "staff_member_id" UUID;

-- 4. Backfill staff_member_id from staff_name
UPDATE "staff_sessions" s
SET "staff_member_id" = m."id"
FROM "staff_members" m
WHERE s."staff_name" = m."name"
  AND s."staff_member_id" IS NULL;

-- 5. Set NOT NULL constraint
ALTER TABLE "staff_sessions" ALTER COLUMN "staff_member_id" SET NOT NULL;

-- 6. Create indexes
CREATE INDEX "staff_sessions_staff_member_id_time_in_idx" ON "staff_sessions"("staff_member_id", "time_in");
CREATE INDEX "staff_sessions_time_out_time_in_idx" ON "staff_sessions"("time_out", "time_in");

-- 7. Add foreign key
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
