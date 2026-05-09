-- Migration 006: confirmed_price on orders, flagging on messages

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS confirmed_price integer;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason text;
