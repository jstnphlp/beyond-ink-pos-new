-- CreateTable
CREATE TABLE "cost_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "material_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ink_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "spoilage_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "cost_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote_id" UUID NOT NULL,
    "cost_profile_id" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "snap_material_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "snap_ink_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "snap_overhead_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "snap_spoilage_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "snap_selling_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "override_price" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "cost_profiles_service_id_inventory_item_id_key" ON "cost_profiles"("service_id", "inventory_item_id");

-- AddForeignKey
ALTER TABLE "cost_profiles" ADD CONSTRAINT "cost_profiles_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_profiles" ADD CONSTRAINT "cost_profiles_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_cost_profile_id_fkey" FOREIGN KEY ("cost_profile_id") REFERENCES "cost_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
