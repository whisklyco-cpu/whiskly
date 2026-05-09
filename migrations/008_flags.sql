ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS requires_admin_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_review_reason text,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by text;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS phone text;
