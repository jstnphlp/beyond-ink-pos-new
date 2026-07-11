-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('draft', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'gcash');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('fixed', 'percentage');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('sale_deduction', 'manual_adjustment', 'purchase_receipt');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('owner', 'staff');

-- CreateEnum
CREATE TYPE "user_department" AS ENUM ('physical_dept', 'design_dept', 'dev_dept');

-- CreateTable
CREATE TABLE "allowed_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'staff',
    "department" "user_department",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'sheet',
    "stock_on_hand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "low_stock_threshold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost_per_unit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" UUID NOT NULL,
    "transaction_id" UUID,
    "movement_type" "MovementType" NOT NULL,
    "quantity_delta" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "icon" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category_id" UUID,
    "description" TEXT NOT NULL DEFAULT '',
    "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "add_ons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_material_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "suggested_unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_material_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_number" BIGINT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'draft',
    "cashier_name" TEXT NOT NULL,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "customer_name" TEXT,
    "delivery_address" TEXT,
    "drop_off_location" TEXT,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_type" "DiscountType",
    "discount_value" DECIMAL(10,2),
    "draft_payload" JSONB NOT NULL DEFAULT '{}',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod",
    "cash_received" DECIMAL(10,2),
    "gcash_amount_paid" DECIMAL(10,2),
    "change_due" DECIMAL(10,2),
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_service_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "service_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_service_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_material_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_line_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "material_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_material_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_add_on_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_entry_id" UUID NOT NULL,
    "add_on_id" UUID NOT NULL,
    "add_on_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_add_on_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'physical_dept',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_member_id" UUID NOT NULL,
    "staff_name" TEXT NOT NULL,
    "time_in" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_out" TIMESTAMPTZ,
    "auto_logged_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_contributors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "staff_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_member_id" UUID,
    "staff_name" TEXT,
    "department" TEXT NOT NULL,
    "period_from" TIMESTAMPTZ NOT NULL,
    "period_to" TIMESTAMPTZ NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "given" BOOLEAN NOT NULL DEFAULT false,
    "given_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribution_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_users_email_key" ON "allowed_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_transaction_number_key" ON "sales_transactions"("transaction_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_name_key" ON "staff_members"("name");

-- CreateIndex
CREATE INDEX "staff_sessions_staff_member_id_time_in_idx" ON "staff_sessions"("staff_member_id", "time_in");

-- CreateIndex
CREATE INDEX "staff_sessions_time_out_time_in_idx" ON "staff_sessions"("time_out", "time_in");

-- CreateIndex
CREATE INDEX "transaction_contributors_transaction_id_idx" ON "transaction_contributors"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_contributors_staff_member_id_idx" ON "transaction_contributors"("staff_member_id");

-- CreateIndex
CREATE INDEX "distribution_payouts_staff_member_id_idx" ON "distribution_payouts"("staff_member_id");

-- CreateIndex
CREATE INDEX "distribution_payouts_period_from_period_to_idx" ON "distribution_payouts"("period_from", "period_to");

-- CreateIndex
CREATE INDEX "distribution_payouts_department_idx" ON "distribution_payouts"("department");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_payouts_department_period_from_period_to_key" ON "distribution_payouts"("department", "period_from", "period_to");

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_material_prices" ADD CONSTRAINT "service_material_prices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_material_prices" ADD CONSTRAINT "service_material_prices_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_service_lines" ADD CONSTRAINT "sales_service_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_service_lines" ADD CONSTRAINT "sales_service_lines_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_material_entries" ADD CONSTRAINT "sales_material_entries_service_line_id_fkey" FOREIGN KEY ("service_line_id") REFERENCES "sales_service_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_material_entries" ADD CONSTRAINT "sales_material_entries_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_add_on_entries" ADD CONSTRAINT "sales_add_on_entries_material_entry_id_fkey" FOREIGN KEY ("material_entry_id") REFERENCES "sales_material_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_add_on_entries" ADD CONSTRAINT "sales_add_on_entries_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "add_ons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_contributors" ADD CONSTRAINT "transaction_contributors_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_contributors" ADD CONSTRAINT "transaction_contributors_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_payouts" ADD CONSTRAINT "distribution_payouts_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
