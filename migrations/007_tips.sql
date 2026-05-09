-- Migration 007: Tip columns on orders table

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tip_amount integer,
  ADD COLUMN IF NOT EXISTS tip_paid_at timestamptz;
