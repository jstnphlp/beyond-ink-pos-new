-- CreateTable
CREATE TABLE "deleted_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "deleted_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "deleted_by" TEXT,

    CONSTRAINT "deleted_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deleted_records_table_name_deleted_at_idx" ON "deleted_records"("table_name", "deleted_at");

-- Trigger function: captures the full row as JSONB before any DELETE
-- TG_ARGV[0] optionally overrides the primary-key column (default 'id')
CREATE OR REPLACE FUNCTION capture_deleted_row()
RETURNS TRIGGER AS $$
DECLARE
    pk_col  text := coalesce(TG_ARGV[0], 'id');
    rec_id  text;
BEGIN
    EXECUTE format('SELECT ($1).%I::text', pk_col)
        INTO rec_id
        USING OLD;

    INSERT INTO "deleted_records" ("table_name", "record_id", "data", "deleted_at")
    VALUES (
        TG_TABLE_NAME,
        rec_id,
        to_jsonb(OLD),
        now()
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach BEFORE DELETE trigger to every user-data table
-- Most tables use "id" as PK; "app_settings" uses "key"

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "allowed_users"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "inventory_items"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "inventory_movements"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "service_categories"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "services"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "add_ons"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "service_material_prices"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "sales_transactions"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "sales_service_lines"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "sales_material_entries"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "sales_add_on_entries"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "staff_members"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "staff_sessions"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "transaction_contributors"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "distribution_payouts"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "cost_profiles"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "quotes"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "quote_line_items"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

-- Wallet page tables (created via Supabase migration, not Prisma)

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_categories"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_entries"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_balance_overrides"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "app_settings"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row('key');
