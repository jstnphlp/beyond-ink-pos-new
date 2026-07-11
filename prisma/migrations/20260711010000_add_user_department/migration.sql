-- CreateEnum
CREATE TYPE "user_department" AS ENUM ('physical_dept', 'design_dept', 'dev_dept');

-- AlterTable
ALTER TABLE "allowed_users" ADD COLUMN "department" "user_department";
