CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_categories"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_entries"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

CREATE TRIGGER trg_capture_deleted_row
    BEFORE DELETE ON "wallet_balance_overrides"
    FOR EACH ROW EXECUTE FUNCTION capture_deleted_row();

