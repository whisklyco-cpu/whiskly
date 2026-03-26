-- Section 1: Stripe Payments & Payout Infrastructure

-- Orders table additions
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ingredient_release_at timestamptz,
  ADD COLUMN IF NOT EXISTS ingredient_release_amount integer,
  ADD COLUMN IF NOT EXISTS balance_charge_date date,
  ADD COLUMN IF NOT EXISTS balance_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_amount integer,
  ADD COLUMN IF NOT EXISTS payout_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_issue_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_session_id text,
  ADD COLUMN IF NOT EXISTS reorder_of uuid REFERENCES orders(id);

-- Bakers table additions
ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS baker_reserve_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instant_payout_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS instant_payout_eligible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

-- Payout schedule table
CREATE TABLE IF NOT EXISTS payout_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  baker_id uuid REFERENCES bakers(id),
  tranche text CHECK (tranche IN ('ingredient_release', 'final_payout')),
  amount_cents integer NOT NULL,
  scheduled_for timestamptz NOT NULL,
  released_at timestamptz,
  stripe_transfer_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Admin tables (Section 3)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id),
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Customer important dates (for cron reminders)
CREATE TABLE IF NOT EXISTS customer_important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  label text NOT NULL,
  month integer NOT NULL,
  day integer NOT NULL,
  reminded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
