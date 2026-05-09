-- ─── PART 1: Payment Plans ───────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_plan boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_date timestamptz,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_amount integer,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_plan_payment2_grace_expires_at timestamptz;

-- ─── PART 2: Multi-Item Orders ───────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_multi_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS line_items jsonb DEFAULT '[]';

-- ─── PART 3: High-Value Order Scope Fields ───────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS scope_serving_count integer,
  ADD COLUMN IF NOT EXISTS scope_flavor_details text,
  ADD COLUMN IF NOT EXISTS scope_design_description text,
  ADD COLUMN IF NOT EXISTS scope_fulfillment_method text,
  ADD COLUMN IF NOT EXISTS scope_confirmed_by_customer boolean DEFAULT false;

-- ─── PART 4: Size Reduction ──────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS size_reduction_requested boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS size_reduction_original_servings integer,
  ADD COLUMN IF NOT EXISTS size_reduction_requested_servings integer,
  ADD COLUMN IF NOT EXISTS size_reduction_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS size_reduction_status text;

-- ─── PART 5: Trusted Member Badge (customers) ────────────────────────────────

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_trusted_member boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trusted_member_since timestamptz;

-- ─── PART 6: Top Baker Badge + Payment Plans Enabled (bakers) ────────────────

ALTER TABLE bakers
  ADD COLUMN IF NOT EXISTS is_top_baker boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS top_baker_since timestamptz,
  ADD COLUMN IF NOT EXISTS payment_plans_enabled boolean DEFAULT false;
