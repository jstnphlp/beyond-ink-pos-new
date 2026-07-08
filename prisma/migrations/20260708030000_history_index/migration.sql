-- Partial index for fast history page queries (completed transactions ordered by date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_txn_completed_at
  ON sales_transactions (completed_at DESC, id DESC)
  WHERE status = 'completed';

-- Index for cancelled transactions (less common but still useful)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_txn_cancelled_at
  ON sales_transactions (created_at DESC, id DESC)
  WHERE status = 'cancelled';
