CREATE TABLE dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  submitted_by text NOT NULL CHECK (submitted_by IN ('customer', 'baker')),
  statement text,
  photo_urls text[] DEFAULT '{}',
  submitted_at timestamptz,
  token text UNIQUE NOT NULL,
  token_expires_at timestamptz NOT NULL,
  UNIQUE(order_id, submitted_by)
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS evidence_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS evidence_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_token ON dispute_evidence(token);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_order ON dispute_evidence(order_id);
